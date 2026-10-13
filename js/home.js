'use strict';
(() => {
  const root=document.getElementById('skyler-featured');
  if(!root)return;
  const slides=[...root.querySelectorAll('.featured-slide')],dots=[...root.querySelectorAll('.featured-dot')];
  if(slides.length<2)return;
  let index=0,timer=null,inView=false,hover=false,focused=false,paused=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const pauseButton=root.querySelector('.featured-pause');
  function show(next){
    index=(next+slides.length)%slides.length;
    slides.forEach((slide,i)=>{slide.hidden=i!==index;slide.classList.toggle('is-active',i===index);});
    dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));
  }
  function schedule(){
    clearTimeout(timer);timer=null;
    if(inView&&!hover&&!focused&&!paused&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>{show(index+1);schedule();},5000);
  }
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>{show(i);schedule();}));
  pauseButton.addEventListener('click',()=>{
    paused=!paused;
    pauseButton.setAttribute('aria-label',paused?'播放文章轮播':'暂停文章轮播');
    pauseButton.title=paused?'播放文章轮播':'暂停文章轮播';
    pauseButton.innerHTML=`<i class="fas fa-${paused?'play':'pause'}" aria-hidden="true"></i>`;
    schedule();
  });
  root.addEventListener('mouseenter',()=>{hover=true;schedule();});
  root.addEventListener('mouseleave',()=>{hover=false;schedule();});
  root.addEventListener('focusin',()=>{focused=true;schedule();});
  root.addEventListener('focusout',e=>{focused=root.contains(e.relatedTarget);schedule();});
  root.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));dots[index].focus();schedule();}});
  let touch=null;
  root.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touch={x:t.clientX,y:t.clientY};},{passive:true});
  root.addEventListener('touchend',e=>{if(!touch)return;const t=e.changedTouches[0],dx=t.clientX-touch.x,dy=t.clientY-touch.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){show(index+(dx<0?1:-1));schedule();}touch=null;},{passive:true});
  document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;schedule();},{threshold:0.2}).observe(root);
  else{inView=true;schedule();}
})();
