/* Preview uploaded attachments locally; downloads require an explicit click. */
(() => {
    let dialog, content, status, download, heading, controller, objectUrl, generation=0, frame, timer;
    const limit=20*1024*1024;
    function cleanup() {
        generation++;
        controller?.abort();
        clearTimeout(timer);
        frame=null;
        if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
        content?.replaceChildren();
    }
    function setup() {
        if(dialog)return;
        dialog=document.createElement("dialog");
        dialog.id="attachmentPreview";
        dialog.setAttribute("aria-labelledby","attachmentPreviewTitle");
        dialog.innerHTML='<header class="attachment-preview__header"><div><small>ATTACHMENT PREVIEW</small><h2 id="attachmentPreviewTitle"></h2></div><div class="attachment-preview__actions"><a class="attachment-preview__download" target="_blank" rel="noopener">Download</a><button type="button" aria-label="Close attachment preview">×</button></div></header><p class="attachment-preview__status" role="status"></p><div class="attachment-preview__content"></div>';
        document.body.append(dialog);
        heading=dialog.querySelector("h2");
        content=dialog.querySelector(".attachment-preview__content");
        status=dialog.querySelector('[role="status"]');
        download=dialog.querySelector("a");
        dialog.querySelector("button").onclick=()=>dialog.close();
        dialog.addEventListener("close",cleanup);
        dialog.addEventListener("click",e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    }
    async function open(url,name) {
        setup();cleanup();
        const current=generation;
        heading.textContent=name;
        download.href=url;
        download.download=name;
        status.textContent="Loading preview…";
        if(!dialog.open)dialog.showModal();
        const extension=name.split(".").pop().toLowerCase();
        const types={pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp"};
        if(extension!=="docx"&&!types[extension]){
            status.textContent="Preview is not available for this file type. Select Download to open the original.";
            return;
        }
        controller=new AbortController();
        timer=setTimeout(()=>controller.abort(),30000);
        try {
            const response=await fetch(url,{signal:controller.signal});
            if(!response.ok)throw Error("File unavailable");
            if(Number(response.headers.get("content-length"))>limit)throw Error("File too large");
            const blob=await response.blob();
            if(blob.size>limit)throw Error("File too large");
            if(current!==generation)return;
            clearTimeout(timer);
            objectUrl=URL.createObjectURL(new Blob([blob],{type:types[extension]||blob.type}));
            download.href=objectUrl;
            if(extension==="docx"){
                const buffer=await blob.arrayBuffer();
                if(current!==generation)return;
                frame=document.createElement("iframe");
                const activeFrame=frame;
                frame.title="Word document preview";
                frame.setAttribute("sandbox","allow-scripts");
                const onMessage=event=>{
                    if(current!==generation||event.source!==activeFrame.contentWindow)return;
                    if(event.data?.type==="docx-ready")activeFrame.contentWindow.postMessage({type:"render-docx",buffer},"*");
                    if(event.data?.type==="docx-complete"||event.data?.type==="docx-failed"){
                        clearTimeout(timer);
                        status.textContent=event.data.type==="docx-complete"?"Word preview · Formatting may differ from the original.":"Preview could not be rendered. Select Download to open in Word.";
                        window.removeEventListener("message",onMessage);
                    }
                };
                window.addEventListener("message",onMessage,{signal:controller.signal});
                frame.srcdoc="<!doctype html><html><head><meta charset=\"utf-8\">\n<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src blob: data:; font-src blob: data:; connect-src 'none';\">\n<style>body{margin:0;background:#e9edf3;font-family:Arial,sans-serif}#message{padding:24px;color:#64748b}.docx-wrapper{padding:20px!important}a{pointer-events:none}</style>\n<script src=\"https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/docx-preview@0.3.6/dist/docx-preview.min.js\"></script></head><body>\n<div id=\"message\">Rendering document…</div><div id=\"pages\"></div>\n<script>\nlet used=false;\naddEventListener(\"message\",async event=>{\n if(event.source!==parent || used || event.data?.type!==\"render-docx\")return;\n used=true;\n try{\n  if(!window.docx)throw Error(\"Renderer unavailable\");\n  await docx.renderAsync(event.data.buffer,document.getElementById(\"pages\"),null,{inWrapper:true,breakPages:true,ignoreLastRenderedPageBreak:false});\n  document.getElementById(\"message\").remove();\n  parent.postMessage({type:\"docx-complete\"},\"*\");\n }catch(_){document.getElementById(\"message\").textContent=\"Preview unavailable. Use Download to open this document in Word.\";parent.postMessage({type:\"docx-failed\"},\"*\");}\n});\nparent.postMessage({type:\"docx-ready\"},\"*\");\n</script></body></html>";
                content.append(frame);
                timer=setTimeout(()=>{if(current===generation){status.textContent="Preview timed out. Select Download to open the original.";controller.abort();}},30000);
            } else if(extension==="pdf"){
                const viewer=document.createElement("iframe");
                viewer.title="PDF preview";
                viewer.src=objectUrl;
                content.append(viewer);
                status.textContent="PDF preview · If your browser cannot display it, use Download.";
            } else {
                const image=document.createElement("img");
                image.alt=name;
                image.src=objectUrl;
                image.onerror=()=>{if(current===generation)status.textContent="Image could not be displayed. Use Download.";};
                content.append(image);
                status.textContent="Image preview";
            }
        }catch(error){
            if(current!==generation)return;
            clearTimeout(timer);
            status.textContent=error.message==="File too large"?"Preview supports files up to 20 MB. Use Download for this file.":"Preview could not load. The file may be unavailable or storage access may block preview. Use Download to open the original.";
        }
    }
    document.addEventListener("click",event=>{
        const link=event.target.closest?.("a.task-file-chip, #currentFile a[href]");
        if(!link||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        if(!["https:","http:"].includes(new URL(link.href).protocol))return;
        event.preventDefault();
        const name=link.title||link.querySelector(".task-file-chip__name")?.textContent||link.textContent.trim();
        open(link.href,name);
    });
})();
