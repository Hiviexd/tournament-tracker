import { Input, Text, Stack, Group, ThemeIcon, Box, Kbd } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHover, useMergedRef, useOs } from "@mantine/hooks";
import { useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import type { UseFileUploadOptions } from "../../hooks/useFileUpload";
import AttachmentDisplay from "./AttachmentDisplay";
import type { AttachmentPreview } from "./AttachmentItem";

interface IProps {
    value: File[];
    onChange: (files: File[]) => void;
    label?: string;
    description?: string;
    placeholder?: string;
    options?: UseFileUploadOptions;
    accept?: string[];
    disabled?: boolean;
    error?: string | null;
}

export default function FileUploadInput({
    value,
    onChange,
    label = "Attachments",
    description = "Allowed types: jpg, png, zip, rar, txt",
    placeholder = "Up to 5 files, maximum of 5MB each",
    options,
    accept = [".jpg", ".png", ".zip", ".rar", ".txt"],
    disabled = false,
    error,
}: IProps) {
    const { hovered, ref: hoverRef } = useHover();
    const modifierKey = useOs() === "macos" ? "⌘" : "Ctrl";

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (!acceptedFiles.length) return;

            if (options?.maxFiles === 1) {
                onChange(acceptedFiles.slice(0, 1));
                return;
            }

            onChange([...value, ...acceptedFiles]);
        },
        [onChange, options?.maxFiles, value],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled,
        multiple: options?.maxFiles !== 1,
    });
    const { ref: dropzoneRef, ...rootProps } = getRootProps();
    const mergedRef = useMergedRef(hoverRef, dropzoneRef);

    useEffect(() => {
        if (disabled || !hovered) return;

        const handlePaste = (event: ClipboardEvent) => {
            const clipboardFiles = event.clipboardData?.files;
            const files = clipboardFiles?.length
                ? Array.from(clipboardFiles)
                : Array.from(event.clipboardData?.items ?? [])
                      .filter((item) => item.kind === "file")
                      .map((item) => item.getAsFile())
                      .filter((file): file is File => file != null);

            if (!files.length) return;

            event.preventDefault();
            onDrop(files);
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [disabled, hovered, onDrop]);

    const previews = useMemo<AttachmentPreview[]>(
        () =>
            value.map((file, index) => ({
                id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
                originalName: file.name,
                url: URL.createObjectURL(file),
                type: file.type,
            })),
        [value],
    );

    useEffect(() => {
        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [previews]);

    const MiniKbd = ({ children }: { children: React.ReactNode }) => {
        return (
            <Kbd size="xs" style={{ borderBottomWidth: undefined }}>
                {children}
            </Kbd>
        );
    };

    return (
        <Input.Wrapper label={label} description={description} error={error}>
            <Stack gap="sm" my="sm">
                <Box
                    {...rootProps}
                    ref={mergedRef}
                    className="file-upload-dropzone"
                    p="md"
                    data-dragging={isDragActive || undefined}
                    data-disabled={disabled || undefined}
                    data-error={error || undefined}>
                    <input {...getInputProps()} accept={accept.join(",")} />
                    <Group gap="sm" wrap="nowrap" align="center">
                        <ThemeIcon variant="light" color="primary" size="lg" radius="sm">
                            <FontAwesomeIcon icon="upload" />
                        </ThemeIcon>
                        <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text size="sm">
                                Drop files, hover and paste with <MiniKbd>{modifierKey}</MiniKbd> + <MiniKbd>V</MiniKbd>{" "}
                                , or click to browse
                            </Text>
                            <Text size="xs" c="dimmed">
                                {placeholder}
                            </Text>
                        </Stack>
                    </Group>
                </Box>
                <AttachmentDisplay
                    attachments={previews}
                    onRemove={disabled ? undefined : (index) => onChange(value.filter((_, i) => i !== index))}
                />
            </Stack>
        </Input.Wrapper>
    );
}
