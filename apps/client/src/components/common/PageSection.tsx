import { Box, BoxProps, Stack } from "@mantine/core";

/**
 * Splits a page into separate cards with gaps between them.
 *
 * Wrap the page's content in `<PageSections>` and each block in a `<PageSection>`:
 *
 * ```tsx
 * <PageSections>
 *     <PageSection>...</PageSection>
 *     <PageSection>...</PageSection>
 * </PageSections>
 * ```
 *
 * The layout detects this wrapper (see `.main-layout:has(.page-sections)` in Layout.scss),
 * drops its own single-panel background, and joins the page header onto the first section.
 * Pages that don't use it keep the regular single-panel layout.
 */
export function PageSections({ children }: { children: React.ReactNode }) {
    return (
        <Stack gap="md" className="page-sections">
            {children}
        </Stack>
    );
}

export function PageSection({ children, className, ...props }: BoxProps & { children: React.ReactNode }) {
    return (
        <Box component="section" className={className ? `page-section ${className}` : "page-section"} {...props}>
            {children}
        </Box>
    );
}
