import fs from "fs";
import path from "path";
import Script from "next/script";
import BodyClass from "./components/BodyClass";

const whiteboardHtml = fs.readFileSync(
  path.join(process.cwd(), "public", "whiteboard-body.html"),
  "utf8"
);

export default function Home() {
  return (
    <>
      <BodyClass className="whiteboard" />
      <div dangerouslySetInnerHTML={{ __html: whiteboardHtml }} />
      <Script src="/whiteboard.js" strategy="afterInteractive" />
    </>
  );
}
