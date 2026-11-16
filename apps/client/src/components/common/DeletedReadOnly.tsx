import { ReactNode } from "react";

interface IProps {
    deleted: boolean;
    children: ReactNode;
}

/** Disables every control on a deleted item's page. The server rejects mutations on deleted items regardless. */
export default function DeletedReadOnly({ deleted, children }: IProps) {
    if (!deleted) return children;

    return (
        <fieldset disabled className="deleted-read-only">
            {children}
        </fieldset>
    );
}
