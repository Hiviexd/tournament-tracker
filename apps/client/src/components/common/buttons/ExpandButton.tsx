import { Button, type ButtonProps } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps extends Omit<ButtonProps, "rightSection"> {
    expanded?: boolean;
    onClick?: () => void;
}

const caretIcon = (expanded: boolean) => (
    <FontAwesomeIcon
        icon="caret-down"
        style={{
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 200ms ease",
        }}
    />
);

export default function ExpandButton({ expanded = false, children, onClick, ...props }: IProps) {
    const hasChildren = children != null;
    return (
        <Button {...props} onClick={onClick} rightSection={hasChildren ? caretIcon(expanded) : undefined}>
            {hasChildren ? children : caretIcon(expanded)}
        </Button>
    );
}
