import{_ as e,o as c,c as t,e as o}from"./app-lzSeYDl-.js";const n={},a=o('<h2 id="一、nexttick-是什么" tabindex="-1"><a class="header-anchor" href="#一、nexttick-是什么" aria-hidden="true">#</a> 一、NextTick 是什么</h2><p>官方对其的定义</p><blockquote><p>在下次 DOM 更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的 DOM</p></blockquote><p>什么意思呢？</p><p>我们可以理解成，<code>Vue</code> 在更新 <code>DOM</code> 时是异步执行的。当数据发生变化，<code>Vue</code>将开启一个异步更新队列，视图需要等队列中所有数据变化完成之后，再统一进行更新</p>',5),d=[a];function i(r,s){return c(),t("div",null,d)}const l=e(n,[["render",i],["__file","nextTick.html.vue"]]);export{l as default};
