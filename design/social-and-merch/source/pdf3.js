const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
const D=process.argv[2], OUT=process.argv[3];
(async()=>{const b=await chromium.launch();
 const files=fs.readdirSync(D).filter(f=>/^print-sheet-\d+\.html$/.test(f)).sort();
 const first=fs.readFileSync(path.join(D,files[0]),'utf8');const head=first.split('<body>')[0];
 const bodies=files.map(f=>fs.readFileSync(path.join(D,f),'utf8').split('<body>')[1].split('</body>')[0]);
 const html=head+'<body>'+bodies.map(x=>'<div style="page-break-after:always">'+x+'</div>').join('')+'</body></html>';
 fs.writeFileSync(path.join(D,'all-sheets.html'),html);
 const p=await b.newPage();await p.goto('file://'+path.join(D,'all-sheets.html'),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 await p.pdf({path:OUT,width:'8.5in',height:'11in',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
 for(const f of files){const q=await b.newPage({viewport:{width:816,height:1056},deviceScaleFactor:3.125});await q.goto('file://'+path.join(D,f),{waitUntil:'networkidle'});await q.evaluate(()=>document.fonts.ready);await q.screenshot({path:path.join(D,f.replace('.html','-300dpi.png'))});await q.close();}
 await b.close();})().catch(e=>{console.error(e);process.exit(1)});
