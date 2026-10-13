'use strict';
(() => {
 const data=document.getElementById('gallery-data');if(!data)return;
 const items=JSON.parse(data.textContent);let current=0,opener=null;
 const dialog=document.createElement('dialog');dialog.id='gallery-dialog';dialog.setAttribute('aria-label','图片预览');
 dialog.innerHTML='<div class="gallery-toolbar"><span id="gallery-image-title"></span><button type="button" class="gallery-close" aria-label="关闭图片预览">×</button></div><div class="gallery-view"><button type="button" class="gallery-prev" aria-label="上一张图片">‹</button><img id="gallery-large-image" alt=""><button type="button" class="gallery-next" aria-label="下一张图片">›</button></div><div class="gallery-bottom"><span id="gallery-image-count"></span><a id="gallery-original" target="_blank" rel="noopener">单独打开图片 ↗</a></div>';
 document.body.append(dialog);
 const image=dialog.querySelector('#gallery-large-image');
 function show(index){current=(index+items.length)%items.length;const item=items[current];image.src=item.image;image.alt=item.title;dialog.querySelector('#gallery-image-title').textContent=item.title;dialog.querySelector('#gallery-image-count').textContent=`${current+1} / ${items.length}`;dialog.querySelector('#gallery-original').href=item.image;}
 document.querySelectorAll('.gallery-open').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();opener=link;show(items.findIndex(item=>item.id===link.dataset.galleryId));dialog.showModal();if(window.CURSOR){window.CURSOR.pause();dialog.append(window.CURSOR.layer);} }));
 dialog.querySelector('.gallery-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('.gallery-prev').addEventListener('click',()=>show(current-1));dialog.querySelector('.gallery-next').addEventListener('click',()=>show(current+1));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}else if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}});
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{if(window.CURSOR)document.body.append(window.CURSOR.layer);image.removeAttribute('src');opener?.focus();});
})();
