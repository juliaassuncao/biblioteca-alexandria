export const epubStyles = `
@charset "UTF-8";
body { font-family: Georgia, serif; line-height: 1.65; color: #342b2b; margin: 5%; overflow-wrap: break-word; }
h1,h2,h3 { line-height: 1.25; color: #613941; text-align: left; break-after: avoid; }
p { margin: 0 0 1em; white-space: pre-wrap; }
.narrative > p { text-align: justify; hyphens: auto; }
a { color: #613941; text-decoration: underline; }
.cover { text-align: center; padding-top: 15%; break-after: page; }
.cover h1 { text-align: center; font-size: 2.3em; }
.credit,.caption { font-size: .85em; color: #645c56; }
.notes,.warnings { border-top: 1px solid #e0d7cb; margin: 1.5em 0; padding-top: 1em; }
.divider { text-align: center; margin: 1.5em auto; color: #a46f54; }
blockquote,.aside,.email,.document,.notice,.excerpt { margin: 1.2em 0; padding: .7em 1em; border-left: 2px solid #a46f54; }
.notice,.aside { background: #f5f1e9; }
.chat { margin: 1.5em 0; }
.message { border: 1px solid #e0d7cb; border-radius: .5em; padding: .7em; margin: .6em 12% .6em 0; text-align: left; }
.message.right { margin-left: 12%; margin-right: 0; background: #f5f1e9; }
.date,.system { text-align: center; font-size: .85em; margin: .7em 0; }
figure { margin: 1em 0; text-align: center; break-inside: avoid; }
img { max-width: 100%; height: auto; max-height: 70vh; object-fit: contain; }
figcaption { font-size: .85em; }
`;
