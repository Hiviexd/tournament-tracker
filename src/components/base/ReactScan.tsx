import { Helmet } from "react-helmet-async";

export default function ReactScan() {
    return (
        <>
            {process.env.NODE_ENV === "development" && (
                <Helmet>
                    <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js"></script>
                </Helmet>
            )}
        </>
    );
}
