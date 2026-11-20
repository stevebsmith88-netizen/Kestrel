const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const D=process.argv[2],O=process.argv[3];
(async()=>{const b=await chromium.launch();
 for(const f of fs.readdirSync(D).filter(f=>/^single-.*\.html$/.test(f))){
  const p=await b.newPage();await p.goto('file://'+path.join(D,f),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  const bb=await (await p.$('svg')).boundingBox();
  await p.pdf({path:path.join(O,f.replace('.html','.pdf')),width:bb.width+'px',height:bb.height+'px',printBackground:false,omitBackground:true,margin:{top:0,right:0,bottom:0,left:0},pageRanges:'1'});
  await p.close();}
 await b.close();})().catch(e=>{console.error(e);process.exit(1)});
