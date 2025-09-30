import { FileInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFileUpload } from "../../hooks/useFileUpload";
import { UseFileUploadOptions } from "../../hooks/useFileUpload";

interface IProps {
    value?: File[];
    onChange?: (files: File[]) => void;
    label?: string;
    description?: string;
    placeholder?: string;
    options?: UseFileUploadOptions;
    accept?: string[];
    disabled?: boolean;
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
}: IProps) {
    const { files, handleFileChange } = useFileUpload(options);

    const handleChange = (newFiles: File | File[] | null) => {
        if (newFiles) {
            handleFileChange(Array.isArray(newFiles) ? newFiles : [newFiles]);
            onChange?.(Array.isArray(newFiles) ? newFiles : [newFiles]);
        }
    };

    return (
        <FileInput
            styles={{
                placeholder: {
                    fontSize: "var(--mantine-font-size-sm)",
                },
            }}
            accept={accept.join(",")}
            multiple={options?.maxFiles === 1 ? false : true}
            leftSection={<FontAwesomeIcon icon="upload" />}
            label={label}
            description={description}
            placeholder={placeholder}
            value={value ?? files}
            onChange={handleChange}
            disabled={disabled}
        />
    );
}
