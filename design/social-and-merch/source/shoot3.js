const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const D=process.argv[2], mode=process.argv[3];
(async()=>{const b=await chromium.launch();
 const files=fs.readdirSync(D).filter(f=>mode==='sheets'?/^print-sheet-\d+\.html$/.test(f):/^single-.*\.html$/.test(f));
 for(const f of files){const p=await b.newPage({viewport:{width:816,height:1056},deviceScaleFactor:mode==='sheets'?1:3.125});
  await p.goto('file://'+path.join(D,f),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  if(mode==='sheets'){await p.screenshot({path:path.join(D,f.replace('.html','-preview.png'))});}
  else{const bb=await (await p.$('svg')).boundingBox();await p.screenshot({path:path.join(D,f.replace('.html','.png')),omitBackground:true,clip:{x:0,y:0,width:Math.ceil(bb.width),height:Math.ceil(bb.height)}});}
  await p.close();}
 await b.close();})().catch(e=>{console.error(e);process.exit(1)});
