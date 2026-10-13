'use strict';
(() => {
  const menu=document.getElementById('rightMenu');
  if(!menu)return;
  const fine=matchMedia('(pointer: fine)');
  const mask=document.createElement('div');mask.className='rmMask';mask.hidden=true;document.body.append(mask);
  let target=null,selection='',link='',image='',opener=null;
  const safeUrl=value=>{if(!value)return '';try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch(_){return '';}};
  const copy=async value=>{
    try{await navigator.clipboard.writeText(value);}
    catch(_){const field=document.createElement('textarea');field.value=value;field.style.cssText='position:fixed;opacity:0';document.body.append(field);field.select();document.execCommand('copy');field.remove();}
  };
  const enabled=()=>{try{return localStorage.getItem('mouse')!=='off';}catch(_){return true;}};
  const updateState=()=>{
    document.documentElement.dataset.rm=enabled()?'on':'off';
    document.querySelectorAll('button[onclick="changeMouseMode()"]').forEach(button=>button.title=enabled()?'右键模式：站点菜单已开启（点击使用系统右键）':'右键模式：系统菜单（点击开启站点右键）');
  };
  const close=()=>{menu.hidden=true;menu.style.display='';mask.hidden=true;};
  window.changeMouseMode=()=>{try{localStorage.setItem('mouse',enabled()?'off':'on');}catch(_){}close();updateState();};
  updateState();
  document.addEventListener('contextmenu',e=>{
    if(!fine.matches||!enabled()||e.shiftKey||e.target.closest('input,textarea,[contenteditable=true],dialog[open]'))return;
    e.preventDefault();
    target=e.target;opener=document.activeElement;
    selection=String(getSelection()||'').trim();
    image=target.closest('img')?.currentSrc||target.closest('img')?.src||'';
    link=safeUrl(target.closest('a[href]')?.href||'');
    menu.querySelector('#menu-text').hidden=!selection;
    menu.querySelector('#menu-img').hidden=!image;
    menu.querySelector('#menu-to').hidden=!link||!!image;
    menu.hidden=false;menu.style.display='block';mask.hidden=false;
    const bounds=menu.getBoundingClientRect();
    const anchor=target.getBoundingClientRect();
    const keyboard=e.clientX===0&&e.clientY===0;
    const x=keyboard?anchor.left+20:e.clientX+10,y=keyboard?anchor.top+20:e.clientY;
    menu.style.left=Math.max(8,Math.min(x,innerWidth-bounds.width-8))+'px';
    menu.style.top=Math.max(8,Math.min(y,innerHeight-bounds.height-8))+'px';
    if(keyboard)menu.querySelector('button').focus();
  });
  const actions={
    back:()=>history.back(),forward:()=>history.forward(),reload:()=>location.reload(),top:()=>scrollToTop(),
    'copy-selection':()=>copy(selection),'search-selection':()=>window.open('https://www.baidu.com/s?wd='+encodeURIComponent(selection),'_blank','noopener'),
    'copy-link':()=>copy(link),'open-link':()=>window.open(link,'_blank','noopener'),
    'copy-image':()=>copy(image),'open-image':()=>window.open(image,'_blank','noopener'),
    'save-image':()=>{const a=document.createElement('a');a.href=image;a.download=new URL(image,location.href).pathname.split('/').pop()||'image';a.click();},
    'copy-page':()=>copy(location.href),random:()=>{const posts=[...document.querySelectorAll('.recent-posts .article-title[href]')];if(posts.length)location.href=posts[Math.floor(Math.random()*posts.length)].href;else location.href='/archives/';},
    theme:event=>switchNightMode(event),appearance:()=>toggleWinbox(),reading:()=>document.getElementById('readmode')?.click(),
    fullscreen:()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen(),print:()=>window.print(),native:()=>changeMouseMode()
  };
  menu.addEventListener('click',async e=>{const action=e.target.closest('[data-rm-action]')?.dataset.rmAction;close();try{if(actions[action])await actions[action](e);}catch(error){console.warn('菜单操作未完成',error.message);}});
  mask.addEventListener('click',close);
  document.addEventListener('keydown',e=>{
    if(menu.hidden)return;
    if(e.key==='Escape'){close();opener?.focus();}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();const items=[...menu.querySelectorAll('[role=menuitem]')].filter(item=>!item.closest('[hidden]'));
      const current=items.indexOf(document.activeElement);items[(current+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
    }
  });
  addEventListener('scroll',close,{passive:true});addEventListener('resize',close,{passive:true});

  // Use the Fomalhaut rope/scroll-progress behavior with the requested local character.
  const desktop=matchMedia('(min-width: 993px) and (pointer: fine)');
  const rope=document.createElement('div');rope.id='myscoll';rope.setAttribute('aria-hidden','true');
  const cat=document.createElement('div');cat.className='neko';cat.setAttribute('aria-hidden','true');cat.dataset.msg='回到顶部 ↑';
  document.body.append(rope,cat);
  let frame=null,rect=null;
  function render(){
    frame=null;
    const visible=desktop.matches&&scrollY>0;
    rope.hidden=cat.hidden=!visible;
    cat.style.display=visible?'block':'none';
    if(!visible){rope.style.display='none';rect=null;return;}
    rope.style.display='block';
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),progress=Math.min(1,scrollY/max);
    const height=progress*innerHeight*0.9;
    rope.style.height=height+'px';cat.style.top=(height-50)+'px';
    cat.classList.toggle('showMsg',progress>=0.999);
    rect=cat.getBoundingClientRect();
  }
  function schedule(){if(frame===null&&!document.hidden)frame=requestAnimationFrame(render);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});desktop.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null;}else schedule();});
  if('ResizeObserver'in window)new ResizeObserver(schedule).observe(document.body);
  document.addEventListener('mousemove',e=>{const hit=rect&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;cat.classList.toggle('hoverOn',!!hit);},{passive:true});
  document.addEventListener('click',e=>{if(!rect||e.target.closest('a,button,input,select,textarea,label,summary,[onclick],[role=button],#rightside'))return;if(e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom)scrollToTop();});
  rope.addEventListener('click',()=>scrollToTop());schedule();
})();
