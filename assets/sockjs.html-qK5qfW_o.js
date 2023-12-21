import{_ as n,o as s,c as a,e as t}from"./app-lzSeYDl-.js";const p="/images/plugins/sockjs1.png",o={},e=t(`<h1 id="在-vue-中使用-sockjs-实现-websocket-通信" tabindex="-1"><a class="header-anchor" href="#在-vue-中使用-sockjs-实现-websocket-通信" aria-hidden="true">#</a> 在 vue 中使用 SockJS 实现 webSocket 通信</h1><p>关于实时通信<br> 实现实时通信,我们通常有三种方法:</p><ul><li>ajax 轮询 ajax 轮询的原理非常简单,让浏览器每隔几秒就像服务器发送一个请求,询问服务器是否有新的信息.</li><li>http 长轮询 长轮询的机制和 ajax 轮询差不多,都是采用轮询的方式,不过过去的是阻塞模型(一直打电话,没收到就不挂电话),也就是说,客户端发起链接后,如果没有消息,就一直不返回 response 给客户端.知道有新的消息才返回,返回完之后,客户端再此建立连接,周而复始.</li><li>WebSocket WebSocket 是 HTML5 开始提供的一种在单个 TCP 连接上进行全双工通讯的协议.在 WebSocket API 中，浏览器和服务器只需要做一个握手的动作，然后，浏览器和服务器之间就形成了一条快速通道。两者之间就直接可以数据互相传送,不需要繁琐的询问和等待.<br> 从上面的介绍很容易看出来,ajax 轮询和长轮询都是非常耗费资源的,ajax 轮询需要服务器有很快的处理速度和资源,http 长轮询需要有很高的并发,也就是同时接待客户的能力.而 WebSocket,只需要经过一次 HTTP 请求,就可以与服务端进行源源不断的消息收发了.</li></ul><h3 id="sockjs-client" tabindex="-1"><a class="header-anchor" href="#sockjs-client" aria-hidden="true">#</a> sockjs-client</h3><p>sockjs-client 是从 SockJS 中分离出来的用于客户端使用的通信模块.所以我们就直接来看看 SockJS. SockJS 是一个浏览器的 JavaScript 库,它提供了一个类似于网络的对象,SockJS 提供了一个连贯的,跨浏览器的 JavaScript API,它在浏览器和 Web 服务器之间创建了一个低延迟,全双工,跨域通信通道. 你可能会问,我为什么不直接用原生的 WebSocket 而要使用 SockJS 呢?这得益于 SockJS 的一大特性,一些浏览器中缺少对 WebSocket 的支持,因此，回退选项是必要的，而 Spring 框架提供了基于 SockJS 协议的透明的回退选项。SockJS 提供了浏览器兼容性,优先使用原生的 WebSocket,如果某个浏览器不支持 WebSocket,SockJS 会自动降级为轮询.</p><h3 id="stomjs" tabindex="-1"><a class="header-anchor" href="#stomjs" aria-hidden="true">#</a> stomjs</h3><p>STOMP(Simple Text-Orientated Messaging Protocol) 面向消息的简单文本协议;<br> WebSocket 是一个消息架构,不强制使用任何特定的消息协议,它依赖于应用层解释消息的含义. 与 HTTP 不同,WebSocket 是处在 TCP 上非常薄的一层,会将字节流转化为文本/二进制消息,因此,对于实际应用来说,WebSocket 的通信形式层级过低,因此，可以在 WebSocket 之上使用 STOMP 协议，来为浏览器 和 server 间的 通信增加适当的消息语义。</p><h3 id="stomp-与-websocket-的关系" tabindex="-1"><a class="header-anchor" href="#stomp-与-websocket-的关系" aria-hidden="true">#</a> STOMP 与 WebSocket 的关系:</h3><p>HTTP 协议解决了 web 浏览器发起请求以及 web 服务器响应请求的细节,假设 HTTP 协议不存在,只能使用 TCP 套接字来编写 web 应用,你可能认为这是一件疯狂的事情; 直接使用 WebSocket(SockJS)就很类似于使用 TCP 套接字来编写 web 应用,因为没有高层协议,就需要我们定义应用间发送消息的语义,还需要确保连接的两端都能遵循这些语义;<br> 同 HTTP 在 TCP 套接字上添加请求-响应模型层一样,STOMP 在 WebSocket 之上提供了一个基于帧的线路格式层,用来定义消息语义.</p><p>代码实现</p><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token comment">// 安装并引入相关模块</span>
<span class="token keyword">import</span> SockJS <span class="token keyword">from</span> <span class="token string">&quot;sockjs-client&quot;</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> Stomp <span class="token keyword">from</span> <span class="token string">&quot;stompjs&quot;</span><span class="token punctuation">;</span>

<span class="token function">onMounted</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token function">initWebSocket</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token function">onUnMounted</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  <span class="token comment">// 页面离开时断开连接,清除定时器</span>
  <span class="token function">disconnect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token function">clearInterval</span><span class="token punctuation">(</span>timer<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">function</span> <span class="token function">initWebSocket</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token function">connection</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 断开重连机制,尝试发送消息,捕获异常发生时重连</span>
  timer <span class="token operator">=</span> <span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">try</span> <span class="token punctuation">{</span>
      stompClient<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token string">&quot;test&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span>err<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&quot;断线了: &quot;</span> <span class="token operator">+</span> err<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token function">connection</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">5000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token keyword">function</span> <span class="token function">connection</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token comment">// 建立连接对象</span>
  socket <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SockJS</span><span class="token punctuation">(</span><span class="token string">&quot;http://xxxxxx:8089/ws&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">//连接服务端提供的通信接口，连接以后才可以订阅广播消息和个人消息</span>
  <span class="token comment">// 获取STOMP子协议的客户端对象</span>
  stompClient <span class="token operator">=</span> Stomp<span class="token punctuation">.</span><span class="token function">over</span><span class="token punctuation">(</span>socket<span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token comment">// 定义客户端的认证信息,按需求配置</span>
  <span class="token keyword">let</span> headers <span class="token operator">=</span> <span class="token punctuation">{</span>
    <span class="token literal-property property">login</span><span class="token operator">:</span> <span class="token string">&quot;mylogin&quot;</span><span class="token punctuation">,</span>
    <span class="token literal-property property">passcode</span><span class="token operator">:</span> <span class="token string">&quot;mypasscode&quot;</span><span class="token punctuation">,</span>
    <span class="token comment">// additional header</span>
    <span class="token string-property property">&quot;client-id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;my-client-id&quot;</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token comment">// 向服务器发起websocket连接</span>
  stompClient<span class="token punctuation">.</span><span class="token function">connect</span><span class="token punctuation">(</span>
    headers<span class="token punctuation">,</span>
    <span class="token punctuation">(</span><span class="token parameter">frame</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
      stompClient<span class="token punctuation">.</span><span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token string">&quot;/topic/chat_msg&quot;</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">msg</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
        <span class="token comment">// 订阅服务端提供的某个topic</span>
        console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>msg<span class="token punctuation">.</span>body<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// msg.body存放的是服务端发送给我们的信息</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">(</span><span class="token parameter">err</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
      <span class="token comment">// 连接发生错误时的处理函数</span>
      console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>err<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
<span class="token comment">// 断开连接</span>
<span class="token keyword">function</span> <span class="token function">disconnect</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">if</span> <span class="token punctuation">(</span>stompClient <span class="token operator">!=</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    stompClient<span class="token punctuation">.</span><span class="token function">disconnect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">&quot;Disconnected&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h1 id="sockjs-client-uncaught-referenceerror-global-is-not-defined-at-1235-browser-crypto-js-3-1" tabindex="-1"><a class="header-anchor" href="#sockjs-client-uncaught-referenceerror-global-is-not-defined-at-1235-browser-crypto-js-3-1" aria-hidden="true">#</a> sockjs-client(Uncaught ReferenceError: global is not defined at 1235 (browser-crypto.js:3:1)</h1><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token keyword">import</span> <span class="token operator">*</span> <span class="token keyword">as</span> SockJS <span class="token keyword">from</span> <span class="token string">&quot;sockjs-client&quot;</span><span class="token punctuation">;</span>

<span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">socketProvider</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">SockJS</span><span class="token punctuation">(</span><span class="token string">&quot;http://localhost:8080/stomp&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><img src="`+p+`" alt="sockjs-client"></p><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code>Uncaught ReferenceError<span class="token operator">:</span> global is not defined
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>utils<span class="token operator">/</span>browser<span class="token operator">-</span>crypto<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>browser<span class="token operator">-</span>crypto<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">3</span><span class="token operator">:</span><span class="token number">1</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>utils<span class="token operator">/</span>random<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>random<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">3</span><span class="token operator">:</span><span class="token number">14</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>utils<span class="token operator">/</span>event<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>event<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">3</span><span class="token operator">:</span><span class="token number">14</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>transport<span class="token operator">/</span>websocket<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>websocket<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">3</span><span class="token operator">:</span><span class="token number">13</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>transport<span class="token operator">-</span>list<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>transport<span class="token operator">-</span>list<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">5</span><span class="token operator">:</span><span class="token number">3</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at node_modules<span class="token operator">/</span>sockjs<span class="token operator">-</span>client<span class="token operator">/</span>lib<span class="token operator">/</span>entry<span class="token punctuation">.</span><span class="token function">js</span> <span class="token punctuation">(</span>entry<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">3</span><span class="token operator">:</span><span class="token number">21</span><span class="token punctuation">)</span>
    at <span class="token function">__require2</span> <span class="token punctuation">(</span>chunk<span class="token operator">-</span><span class="token constant">OZI5HTJH</span><span class="token punctuation">.</span>js<span class="token operator">?</span>v<span class="token operator">=</span>99c693f2<span class="token operator">:</span><span class="token number">15</span><span class="token operator">:</span><span class="token number">50</span><span class="token punctuation">)</span>
    at entry<span class="token punctuation">.</span>js<span class="token operator">:</span><span class="token number">10</span><span class="token operator">:</span><span class="token number">1</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="这个-global-是-sockjs-client-需要使用的-对于-sockjs-client-来说-global-就是-window。" tabindex="-1"><a class="header-anchor" href="#这个-global-是-sockjs-client-需要使用的-对于-sockjs-client-来说-global-就是-window。" aria-hidden="true">#</a> 这个 global 是 sockjs-client 需要使用的，对于 sockjs-client 来说 global 就是 window。</h4><p>我们在 index.html 定义 global</p><ul><li>解决方法 1:</li></ul><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token comment">// 在 index.html 中，添加</span>
<span class="token operator">&lt;</span>script<span class="token operator">&gt;</span>global <span class="token operator">=</span> globalThis<span class="token operator">&lt;</span><span class="token operator">/</span>script<span class="token operator">&gt;</span>
<span class="token comment">// 或</span>
<span class="token operator">&lt;</span>script<span class="token operator">&gt;</span>
<span class="token keyword">let</span> global <span class="token operator">=</span> window<span class="token punctuation">;</span> <span class="token comment">// fix global is undefined in socketjs-client</span>
<span class="token operator">&lt;</span><span class="token operator">/</span>script<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>解决方法 2 改变引入方式，将 import SockJS from ‘sockjs-client’; 改为 import SockJS from ‘sockjs-client/dist/sockjs.min.js’;</li></ul><div class="language-javascript line-numbers-mode" data-ext="js"><pre class="language-javascript"><code><span class="token comment">//import SockJS from  &#39;sockjs-client&#39;;</span>
<span class="token keyword">import</span> SockJS <span class="token keyword">from</span> <span class="token string">&quot;sockjs-client/dist/sockjs.min.js&quot;</span><span class="token punctuation">;</span>
<span class="token keyword">import</span> Stomp <span class="token keyword">from</span> <span class="token string">&quot;stompjs&quot;</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,21),c=[e];function l(i,u){return s(),a("div",null,c)}const k=n(o,[["render",l],["__file","sockjs.html.vue"]]);export{k as default};
