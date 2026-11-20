workspace "SpecSpace example" "A local architecture exploration example" {
    model {
        reader = person "Reader" "Explores and reviews architecture artifacts"
        product = softwareSystem "SpecSpace" "Local understanding and review workspace" {
            desktop = container "Desktop" "Native document interface" "Tauri and React" {
                editor = component "Source editor" "Preserves the original document buffer" "CodeMirror"
                explorer = component "Architecture explorer" "Displays derived Structurizr views" "React Flow"
            }
            files = container "Workspace files" "Portable Markdown and DSL documents" "Filesystem" {
                tags "Storage"
            }
        }
        agent = softwareSystem "Authoring agent" "Authors artifacts outside this application"
        reader -> product "Reviews artifacts"
        agent -> product "Supplies authored artifacts"
        desktop -> files "Reads and explicitly saves" "Rust boundary"
        editor -> explorer "Supplies the current source buffer"
    }
    views {
        systemLandscape "landscape" {
            include *
            autoLayout lr
        }
        systemContext product "context" {
            include *
            autoLayout lr
        }
        container product "containers" {
            include *
            autoLayout lr
        }
        component desktop "components" {
            include *
            autoLayout lr
        }
        styles {
            element "Storage" {
                shape Cylinder
                background #dbeae2
            }
        }
    }
}
