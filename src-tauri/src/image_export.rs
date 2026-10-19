use std::{
    borrow::Cow,
    io::{Cursor, Write},
    path::Path,
};
use tauri_plugin_dialog::DialogExt;

fn decode(bytes: &[u8]) -> Result<(Vec<u8>, u32, u32), String> {
    if bytes.len() > 64 * 1024 * 1024 {
        return Err("PNG exceeds the 64 MiB limit.".into());
    }
    let mut decoder = png::Decoder::new(Cursor::new(bytes));
    decoder.set_transformations(png::Transformations::EXPAND | png::Transformations::STRIP_16);
    let mut reader = decoder.read_info().map_err(|e| e.to_string())?;
    let info = reader.info();
    if info.width == 0
        || info.height == 0
        || info.width > 8192
        || info.height > 8192
        || u64::from(info.width) * u64::from(info.height) > 16_000_000
    {
        return Err("Diagram exceeds the 8192-pixel or 16-megapixel export limit.".into());
    }
    let mut buffer = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buffer).map_err(|e| e.to_string())?;
    let mut rgba = Vec::with_capacity(info.width as usize * info.height as usize * 4);
    let samples = info.color_type.samples();
    for pixel in buffer[..info.buffer_size()].chunks_exact(samples) {
        match info.color_type {
            png::ColorType::Rgba => rgba.extend_from_slice(pixel),
            png::ColorType::Rgb => rgba.extend_from_slice(&[pixel[0], pixel[1], pixel[2], 255]),
            png::ColorType::Grayscale => {
                rgba.extend_from_slice(&[pixel[0], pixel[0], pixel[0], 255])
            }
            png::ColorType::GrayscaleAlpha => {
                rgba.extend_from_slice(&[pixel[0], pixel[0], pixel[0], pixel[1]])
            }
            _ => return Err("Unsupported PNG color format.".into()),
        }
    }
    Ok((rgba, info.width, info.height))
}

fn write_png(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let path = if path.extension().is_none() {
        path.with_extension("png")
    } else {
        path.to_path_buf()
    };
    if !path
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("png"))
    {
        return Err("Choose a .png filename.".into());
    }
    let parent = path.parent().ok_or("Invalid destination.")?;
    let mut file = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    file.write_all(bytes).map_err(|e| e.to_string())?;
    file.as_file().sync_all().map_err(|e| e.to_string())?;
    file.persist_noclobber(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn save_diagram_png(
    app: tauri::AppHandle,
    bytes: Vec<u8>,
    filename: String,
) -> Result<bool, String> {
    decode(&bytes)?;
    let (sender, receiver) = std::sync::mpsc::channel();
    let suggested = Path::new(&filename)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("diagram.png")
        .to_owned();
    app.dialog()
        .file()
        .set_title("Save diagram as PNG")
        .set_file_name(suggested)
        .save_file(move |selected| {
            let _ = sender.send(selected);
        });
    tauri::async_runtime::spawn_blocking(move || {
        let selected = receiver.recv().map_err(|e| e.to_string())?;
        let Some(selected) = selected else {
            return Ok(false);
        };
        let path = selected.into_path().map_err(|e| e.to_string())?;
        write_png(&path, &bytes)?;
        Ok(true)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn copy_diagram_image(bytes: Vec<u8>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (rgba, width, height) = decode(&bytes)?;
        let mut clipboard = arboard::Clipboard::new().map_err(|e| e.to_string())?;
        clipboard
            .set_image(arboard::ImageData {
                width: width as usize,
                height: height as usize,
                bytes: Cow::Owned(rgba),
            })
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_invalid_images_and_preserves_existing_files() {
        assert!(decode(b"not a PNG").is_err());
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("diagram.png");
        std::fs::write(&path, b"original").unwrap();
        assert!(write_png(&path, b"replacement").is_err());
        assert_eq!(std::fs::read(path).unwrap(), b"original");
        assert!(write_png(&dir.path().join("bad.jpg"), b"image").is_err());
    }
}
