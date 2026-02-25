(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function s(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(r){if(r.ep)return;r.ep=!0;const n=s(r);fetch(r.href,n)}})();const ce="ws-status-change",Fe=100,We=1e3,Be=3e4,qe=.2,Ve=5,Qe=6e4,M=class M extends EventTarget{constructor(){super(),this.socket=null,this.url=null,this.status="disconnected",this.retryCount=0,this.reconnectTimer=null,this.sendQueue=[],this.subscriptions=[]}static getInstance(){return M.instance||(M.instance=new M),M.instance}connect(e){this.socket&&this.url===e&&this.status==="connected"||(this.url=e,this.retryCount=0,this.openSocket())}disconnect(){this.stopReconnect(),this.socket&&(this.socket.onclose=null,this.socket.close(1e3,"disconnect"),this.socket=null),this.setStatus("disconnected")}subscribe(e,s){const o={eventKind:e,handler:s};return this.subscriptions.push(o),()=>{this.subscriptions=this.subscriptions.filter(r=>r!==o)}}subscribeAll(e){return this.subscribe("*",e)}send(e){this.socket&&this.status==="connected"?this.socket.send(JSON.stringify(e)):(this.sendQueue.length>=Fe&&this.sendQueue.shift(),this.sendQueue.push(e))}getStatus(){return this.status}onStatusChange(e){const s=o=>{e(o.detail)};return this.addEventListener(ce,s),()=>this.removeEventListener(ce,s)}openSocket(){if(this.url){this.setStatus("connecting");try{this.socket=new WebSocket(this.url)}catch{this.setStatus("error"),this.scheduleReconnect();return}this.socket.onopen=()=>{this.retryCount=0,this.setStatus("connected"),this.flushSendQueue()},this.socket.onmessage=e=>{this.handleIncomingMessage(e.data)},this.socket.onerror=()=>{this.setStatus("error")},this.socket.onclose=()=>{this.socket=null,this.status!=="disconnected"&&this.scheduleReconnect()}}}handleIncomingMessage(e){let s;try{s=typeof e=="string"?JSON.parse(e):e}catch{return}if(typeof s!="object"||s===null)return;const r=s.eventKind??"";for(const n of this.subscriptions)if(n.eventKind==="*"||n.eventKind===r)try{n.handler(s)}catch{}}flushSendQueue(){var e;for(;this.sendQueue.length>0&&this.status==="connected";){const s=this.sendQueue.shift();(e=this.socket)==null||e.send(JSON.stringify(s))}}scheduleReconnect(){if(this.reconnectTimer!==null)return;if(this.retryCount>=Ve){this.retryCount=0,this.setStatus("disconnected"),this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null,this.openSocket()},Qe);return}const e=Math.min(We*2**this.retryCount,Be),s=e*qe*(Math.random()*2-1),o=Math.max(0,e+s);this.retryCount++,this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null,this.openSocket()},o)}stopReconnect(){this.reconnectTimer!==null&&(clearTimeout(this.reconnectTimer),this.reconnectTimer=null)}setStatus(e){this.status!==e&&(this.status=e,this.dispatchEvent(new CustomEvent(ce,{detail:e})))}};M.instance=null;let $=M;const m=t=>new Promise(e=>setTimeout(e,t)),l=()=>new Date().toISOString();async function Ge(){const t=$.getInstance(),e=s=>{try{t.handleIncomingMessage(JSON.stringify(s))}catch{const o=t.subscriptions??[];for(const r of o)(r.eventKind==="*"||r.eventKind===s.eventKind)&&r.handler(s)}};t.status="connected",t.dispatchEvent(new CustomEvent("ws-status-change",{detail:"connected"})),console.log("🎬 Demo: Starting fake agent orchestrator scenario..."),e({eventKind:"session.created",sessionKey:"agent:main:discord:111",timestamp:l(),model:"github-copilot/claude-sonnet-4.6",channel:"discord",label:"main"}),await m(1200),e({eventKind:"session.created",sessionKey:"agent:planner:cron:222",parentSessionKey:"agent:main:discord:111",timestamp:l(),model:"github-copilot/claude-opus-4.6",channel:"cron",label:'planner — "Build a Weather App"'}),e({eventKind:"run.started",sessionKey:"agent:planner:cron:222",timestamp:l(),runId:"run-planner-1",taskSummary:"Planning: Build a Weather App"}),await m(800),e({eventKind:"tool.started",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"exec",argsSummary:"mcporter call notion.notion-fetch (ticket body)"}),await m(600),e({eventKind:"tool.completed",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"exec",resultSummary:'✓ Fetched ticket: "Build a Weather App — show current + 5-day forecast"',isError:!1}),await m(900),e({eventKind:"tool.started",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"web_search",argsSummary:'"best weather app tech stack 2026 React"'}),await m(1400),e({eventKind:"tool.completed",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"web_search",resultSummary:"✓ Vite + React + Tailwind + Open-Meteo API (free, no key required)",isError:!1}),await m(700),e({eventKind:"tool.started",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"web_search",argsSummary:'"open-meteo api documentation forecast endpoint"'}),await m(1100),e({eventKind:"tool.completed",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"web_search",resultSummary:"✓ GET /v1/forecast?lat=...&lon=...&daily=temperature_2m_max",isError:!1}),await m(900),e({eventKind:"tool.started",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"exec",argsSummary:"mcporter call notion.notion-update-page (write plan + Status → Ready for Work)"}),await m(600),e({eventKind:"tool.completed",sessionKey:"agent:planner:cron:222",timestamp:l(),toolName:"exec",resultSummary:'✓ Plan written to Notion. Status set to "Ready for Work"',isError:!1}),e({eventKind:"run.completed",sessionKey:"agent:planner:cron:222",timestamp:l(),runId:"run-planner-1",tokenCounts:{inputTokens:5200,outputTokens:1100,totalTokens:6300,estimatedCostUsd:.018}}),e({eventKind:"session.destroyed",sessionKey:"agent:planner:cron:222",timestamp:l()}),await m(1800),e({eventKind:"session.created",sessionKey:"agent:maestro:cron:333",parentSessionKey:"agent:main:discord:111",timestamp:l(),model:"github-copilot/claude-sonnet-4.6",channel:"cron",label:'maestro — "Build a Weather App"'}),e({eventKind:"run.started",sessionKey:"agent:maestro:cron:333",timestamp:l(),runId:"run-maestro-1",taskSummary:"Orchestrating 4 subtasks"}),await m(800),e({eventKind:"tool.started",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",argsSummary:"mcporter call notion.notion-fetch (read plan checkboxes)"}),await m(700),e({eventKind:"tool.completed",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",resultSummary:"✓ Plan has 4 tasks: scaffold, API integration, UI components, deploy",isError:!1}),await m(1e3),e({eventKind:"subagent.spawned",sessionKey:"agent:maestro:cron:333",timestamp:l(),childSessionKey:"agent:worker:sub:444",agentId:"worker",label:"worker-1-scaffold"}),e({eventKind:"session.created",sessionKey:"agent:worker:sub:444",parentSessionKey:"agent:maestro:cron:333",timestamp:l(),model:"github-copilot/claude-haiku-4.5",channel:"subagent",label:"worker-1 — scaffold app"}),e({eventKind:"run.started",sessionKey:"agent:worker:sub:444",timestamp:l(),runId:"run-worker-1",taskSummary:"npx create-vite weather-app"}),await m(800),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:444",timestamp:l(),toolName:"exec",argsSummary:"npx create-vite weather-app --template react-ts"}),await m(2200),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:444",timestamp:l(),toolName:"exec",resultSummary:"✓ Scaffolded in workspace/projects/weather-app/",isError:!1}),await m(600),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:444",timestamp:l(),toolName:"exec",argsSummary:"npm install (Tailwind, axios)"}),await m(1600),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:444",timestamp:l(),toolName:"exec",resultSummary:"✓ Dependencies installed",isError:!1}),e({eventKind:"run.completed",sessionKey:"agent:worker:sub:444",timestamp:l(),runId:"run-worker-1",tokenCounts:{inputTokens:900,outputTokens:200,totalTokens:1100,estimatedCostUsd:.001}}),e({eventKind:"session.destroyed",sessionKey:"agent:worker:sub:444",timestamp:l()}),await m(600),e({eventKind:"tool.started",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",argsSummary:"mcporter notion-update-page — check off Task 1"}),await m(400),e({eventKind:"tool.completed",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",resultSummary:"✓ [x] Task 1: Scaffold complete",isError:!1}),await m(800),e({eventKind:"subagent.spawned",sessionKey:"agent:maestro:cron:333",timestamp:l(),childSessionKey:"agent:worker:sub:555",agentId:"worker",label:"worker-2-api"}),e({eventKind:"session.created",sessionKey:"agent:worker:sub:555",parentSessionKey:"agent:maestro:cron:333",timestamp:l(),model:"github-copilot/claude-haiku-4.5",channel:"subagent",label:"worker-2 — Open-Meteo API"}),e({eventKind:"run.started",sessionKey:"agent:worker:sub:555",timestamp:l(),runId:"run-worker-2",taskSummary:"Write api.ts + useWeather hook"}),await m(700),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:555",timestamp:l(),toolName:"write",argsSummary:"src/api/weather.ts"}),await m(900),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:555",timestamp:l(),toolName:"write",resultSummary:"✓ Written: fetchForecast(lat, lon) → WeatherData",isError:!1}),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:555",timestamp:l(),toolName:"write",argsSummary:"src/hooks/useWeather.ts"}),await m(700),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:555",timestamp:l(),toolName:"write",resultSummary:"✓ Written: useWeather(city) with loading/error states",isError:!1}),e({eventKind:"run.completed",sessionKey:"agent:worker:sub:555",timestamp:l(),runId:"run-worker-2",tokenCounts:{inputTokens:1400,outputTokens:380,totalTokens:1780,estimatedCostUsd:.002}}),e({eventKind:"session.destroyed",sessionKey:"agent:worker:sub:555",timestamp:l()}),await m(500),e({eventKind:"tool.started",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",argsSummary:"mcporter notion-update-page — check off Task 2"}),await m(400),e({eventKind:"tool.completed",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",resultSummary:"✓ [x] Task 2: API integration complete",isError:!1}),await m(800),e({eventKind:"subagent.spawned",sessionKey:"agent:maestro:cron:333",timestamp:l(),childSessionKey:"agent:worker:sub:666",agentId:"worker",label:"worker-3-ui"}),e({eventKind:"session.created",sessionKey:"agent:worker:sub:666",parentSessionKey:"agent:maestro:cron:333",timestamp:l(),model:"github-copilot/claude-haiku-4.5",channel:"subagent",label:"worker-3 — UI components"}),e({eventKind:"run.started",sessionKey:"agent:worker:sub:666",timestamp:l(),runId:"run-worker-3",taskSummary:"Build ForecastCard + SearchBar components"}),await m(700),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"exec",argsSummary:"npm run typecheck"}),await m(900),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"exec",resultSummary:'✗ Error: Type WeatherData missing "hourly" field (api.ts line 14)',isError:!0}),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"edit",argsSummary:"src/api/weather.ts — add hourly field to type"}),await m(500),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"edit",resultSummary:"✓ Fixed. Type extended with hourly: HourlyData[]",isError:!1}),e({eventKind:"tool.started",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"write",argsSummary:"src/components/ForecastCard.tsx"}),await m(800),e({eventKind:"tool.completed",sessionKey:"agent:worker:sub:666",timestamp:l(),toolName:"write",resultSummary:"✓ Written: ForecastCard with temp + icon + wind",isError:!1}),e({eventKind:"run.completed",sessionKey:"agent:worker:sub:666",timestamp:l(),runId:"run-worker-3",tokenCounts:{inputTokens:2100,outputTokens:490,totalTokens:2590,estimatedCostUsd:.003}}),e({eventKind:"session.destroyed",sessionKey:"agent:worker:sub:666",timestamp:l()}),await m(1200),e({eventKind:"tool.started",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",argsSummary:"mcporter notion-update-page — Status: Done, Result: weather app complete"}),await m(500),e({eventKind:"tool.completed",sessionKey:"agent:maestro:cron:333",timestamp:l(),toolName:"exec",resultSummary:"✓ Ticket marked Done",isError:!1}),e({eventKind:"run.completed",sessionKey:"agent:maestro:cron:333",timestamp:l(),runId:"run-maestro-1",tokenCounts:{inputTokens:3100,outputTokens:420,totalTokens:3520,estimatedCostUsd:.006}}),e({eventKind:"session.destroyed",sessionKey:"agent:maestro:cron:333",timestamp:l()}),console.log("🎬 Demo complete! Total simulated cost: ~$0.030")}/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const se=globalThis,me=se.ShadowRoot&&(se.ShadyCSS===void 0||se.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,fe=Symbol(),ye=new WeakMap;let ze=class{constructor(e,s,o){if(this._$cssResult$=!0,o!==fe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=s}get styleSheet(){let e=this.o;const s=this.t;if(me&&e===void 0){const o=s!==void 0&&s.length===1;o&&(e=ye.get(s)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&ye.set(s,e))}return e}toString(){return this.cssText}};const Je=t=>new ze(typeof t=="string"?t:t+"",void 0,fe),H=(t,...e)=>{const s=t.length===1?t[0]:e.reduce((o,r,n)=>o+(a=>{if(a._$cssResult$===!0)return a.cssText;if(typeof a=="number")return a;throw Error("Value passed to 'css' function must be a 'css' function result: "+a+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+t[n+1],t[0]);return new ze(s,t,fe)},Xe=(t,e)=>{if(me)t.adoptedStyleSheets=e.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of e){const o=document.createElement("style"),r=se.litNonce;r!==void 0&&o.setAttribute("nonce",r),o.textContent=s.cssText,t.appendChild(o)}},xe=me?t=>t:t=>t instanceof CSSStyleSheet?(e=>{let s="";for(const o of e.cssRules)s+=o.cssText;return Je(s)})(t):t;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:Ye,defineProperty:Ze,getOwnPropertyDescriptor:et,getOwnPropertyNames:tt,getOwnPropertySymbols:st,getPrototypeOf:ot}=Object,A=globalThis,$e=A.trustedTypes,rt=$e?$e.emptyScript:"",le=A.reactiveElementPolyfillSupport,V=(t,e)=>t,oe={toAttribute(t,e){switch(e){case Boolean:t=t?rt:null;break;case Object:case Array:t=t==null?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=t!==null;break;case Number:s=t===null?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch{s=null}}return s}},ge=(t,e)=>!Ye(t,e),we={attribute:!0,type:String,converter:oe,reflect:!1,useDefault:!1,hasChanged:ge};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),A.litPropertyMetadata??(A.litPropertyMetadata=new WeakMap);let D=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??(this.l=[])).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,s=we){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(e,s),!s.noAccessor){const o=Symbol(),r=this.getPropertyDescriptor(e,o,s);r!==void 0&&Ze(this.prototype,e,r)}}static getPropertyDescriptor(e,s,o){const{get:r,set:n}=et(this.prototype,e)??{get(){return this[s]},set(a){this[s]=a}};return{get:r,set(a){const c=r==null?void 0:r.call(this);n==null||n.call(this,a),this.requestUpdate(e,c,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??we}static _$Ei(){if(this.hasOwnProperty(V("elementProperties")))return;const e=ot(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(V("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(V("properties"))){const s=this.properties,o=[...tt(s),...st(s)];for(const r of o)this.createProperty(r,s[r])}const e=this[Symbol.metadata];if(e!==null){const s=litPropertyMetadata.get(e);if(s!==void 0)for(const[o,r]of s)this.elementProperties.set(o,r)}this._$Eh=new Map;for(const[s,o]of this.elementProperties){const r=this._$Eu(s,o);r!==void 0&&this._$Eh.set(r,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const s=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const r of o)s.unshift(xe(r))}else e!==void 0&&s.push(xe(e));return s}static _$Eu(e,s){const o=s.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var e;this._$ES=new Promise(s=>this.enableUpdating=s),this._$AL=new Map,this._$E_(),this.requestUpdate(),(e=this.constructor.l)==null||e.forEach(s=>s(this))}addController(e){var s;(this._$EO??(this._$EO=new Set)).add(e),this.renderRoot!==void 0&&this.isConnected&&((s=e.hostConnected)==null||s.call(e))}removeController(e){var s;(s=this._$EO)==null||s.delete(e)}_$E_(){const e=new Map,s=this.constructor.elementProperties;for(const o of s.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Xe(e,this.constructor.elementStyles),e}connectedCallback(){var e;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),(e=this._$EO)==null||e.forEach(s=>{var o;return(o=s.hostConnected)==null?void 0:o.call(s)})}enableUpdating(e){}disconnectedCallback(){var e;(e=this._$EO)==null||e.forEach(s=>{var o;return(o=s.hostDisconnected)==null?void 0:o.call(s)})}attributeChangedCallback(e,s,o){this._$AK(e,o)}_$ET(e,s){var n;const o=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,o);if(r!==void 0&&o.reflect===!0){const a=(((n=o.converter)==null?void 0:n.toAttribute)!==void 0?o.converter:oe).toAttribute(s,o.type);this._$Em=e,a==null?this.removeAttribute(r):this.setAttribute(r,a),this._$Em=null}}_$AK(e,s){var n,a;const o=this.constructor,r=o._$Eh.get(e);if(r!==void 0&&this._$Em!==r){const c=o.getPropertyOptions(r),i=typeof c.converter=="function"?{fromAttribute:c.converter}:((n=c.converter)==null?void 0:n.fromAttribute)!==void 0?c.converter:oe;this._$Em=r;const p=i.fromAttribute(s,c.type);this[r]=p??((a=this._$Ej)==null?void 0:a.get(r))??p,this._$Em=null}}requestUpdate(e,s,o,r=!1,n){var a;if(e!==void 0){const c=this.constructor;if(r===!1&&(n=this[e]),o??(o=c.getPropertyOptions(e)),!((o.hasChanged??ge)(n,s)||o.useDefault&&o.reflect&&n===((a=this._$Ej)==null?void 0:a.get(e))&&!this.hasAttribute(c._$Eu(e,o))))return;this.C(e,s,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,s,{useDefault:o,reflect:r,wrapped:n},a){o&&!(this._$Ej??(this._$Ej=new Map)).has(e)&&(this._$Ej.set(e,a??s??this[e]),n!==!0||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(s=void 0),this._$AL.set(e,s)),r===!0&&this._$Em!==e&&(this._$Eq??(this._$Eq=new Set)).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var o;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[n,a]of this._$Ep)this[n]=a;this._$Ep=void 0}const r=this.constructor.elementProperties;if(r.size>0)for(const[n,a]of r){const{wrapped:c}=a,i=this[n];c!==!0||this._$AL.has(n)||i===void 0||this.C(n,void 0,a,i)}}let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),(o=this._$EO)==null||o.forEach(r=>{var n;return(n=r.hostUpdate)==null?void 0:n.call(r)}),this.update(s)):this._$EM()}catch(r){throw e=!1,this._$EM(),r}e&&this._$AE(s)}willUpdate(e){}_$AE(e){var s;(s=this._$EO)==null||s.forEach(o=>{var r;return(r=o.hostUpdated)==null?void 0:r.call(o)}),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&(this._$Eq=this._$Eq.forEach(s=>this._$ET(s,this[s]))),this._$EM()}updated(e){}firstUpdated(e){}};D.elementStyles=[],D.shadowRootOptions={mode:"open"},D[V("elementProperties")]=new Map,D[V("finalized")]=new Map,le==null||le({ReactiveElement:D}),(A.reactiveElementVersions??(A.reactiveElementVersions=[])).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Q=globalThis,Se=t=>t,re=Q.trustedTypes,ke=re?re.createPolicy("lit-html",{createHTML:t=>t}):void 0,Ue="$lit$",_=`lit$${Math.random().toFixed(9).slice(2)}$`,je="?"+_,nt=`<${je}>`,I=document,G=()=>I.createComment(""),J=t=>t===null||typeof t!="object"&&typeof t!="function",ve=Array.isArray,at=t=>ve(t)||typeof(t==null?void 0:t[Symbol.iterator])=="function",de=`[ 	
\f\r]`,B=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_e=/-->/g,Ae=/>/g,T=RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Ke=/'/g,Ce=/"/g,De=/^(?:script|style|textarea|title)$/i,it=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),h=it(1),N=Symbol.for("lit-noChange"),u=Symbol.for("lit-nothing"),Te=new WeakMap,O=I.createTreeWalker(I,129);function Re(t,e){if(!ve(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return ke!==void 0?ke.createHTML(e):e}const ct=(t,e)=>{const s=t.length-1,o=[];let r,n=e===2?"<svg>":e===3?"<math>":"",a=B;for(let c=0;c<s;c++){const i=t[c];let p,v,d=-1,g=0;for(;g<i.length&&(a.lastIndex=g,v=a.exec(i),v!==null);)g=a.lastIndex,a===B?v[1]==="!--"?a=_e:v[1]!==void 0?a=Ae:v[2]!==void 0?(De.test(v[2])&&(r=RegExp("</"+v[2],"g")),a=T):v[3]!==void 0&&(a=T):a===T?v[0]===">"?(a=r??B,d=-1):v[1]===void 0?d=-2:(d=a.lastIndex-v[2].length,p=v[1],a=v[3]===void 0?T:v[3]==='"'?Ce:Ke):a===Ce||a===Ke?a=T:a===_e||a===Ae?a=B:(a=T,r=void 0);const f=a===T&&t[c+1].startsWith("/>")?" ":"";n+=a===B?i+nt:d>=0?(o.push(p),i.slice(0,d)+Ue+i.slice(d)+_+f):i+_+(d===-2?c:f)}return[Re(t,n+(t[s]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]};class X{constructor({strings:e,_$litType$:s},o){let r;this.parts=[];let n=0,a=0;const c=e.length-1,i=this.parts,[p,v]=ct(e,s);if(this.el=X.createElement(p,o),O.currentNode=this.el.content,s===2||s===3){const d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(r=O.nextNode())!==null&&i.length<c;){if(r.nodeType===1){if(r.hasAttributes())for(const d of r.getAttributeNames())if(d.endsWith(Ue)){const g=v[a++],f=r.getAttribute(d).split(_),y=/([.?@])?(.*)/.exec(g);i.push({type:1,index:n,name:y[2],strings:f,ctor:y[1]==="."?dt:y[1]==="?"?pt:y[1]==="@"?ut:ae}),r.removeAttribute(d)}else d.startsWith(_)&&(i.push({type:6,index:n}),r.removeAttribute(d));if(De.test(r.tagName)){const d=r.textContent.split(_),g=d.length-1;if(g>0){r.textContent=re?re.emptyScript:"";for(let f=0;f<g;f++)r.append(d[f],G()),O.nextNode(),i.push({type:2,index:++n});r.append(d[g],G())}}}else if(r.nodeType===8)if(r.data===je)i.push({type:2,index:n});else{let d=-1;for(;(d=r.data.indexOf(_,d+1))!==-1;)i.push({type:7,index:n}),d+=_.length-1}n++}}static createElement(e,s){const o=I.createElement("template");return o.innerHTML=e,o}}function R(t,e,s=t,o){var a,c;if(e===N)return e;let r=o!==void 0?(a=s._$Co)==null?void 0:a[o]:s._$Cl;const n=J(e)?void 0:e._$litDirective$;return(r==null?void 0:r.constructor)!==n&&((c=r==null?void 0:r._$AO)==null||c.call(r,!1),n===void 0?r=void 0:(r=new n(t),r._$AT(t,s,o)),o!==void 0?(s._$Co??(s._$Co=[]))[o]=r:s._$Cl=r),r!==void 0&&(e=R(t,r._$AS(t,e.values),r,o)),e}class lt{constructor(e,s){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:s},parts:o}=this._$AD,r=((e==null?void 0:e.creationScope)??I).importNode(s,!0);O.currentNode=r;let n=O.nextNode(),a=0,c=0,i=o[0];for(;i!==void 0;){if(a===i.index){let p;i.type===2?p=new L(n,n.nextSibling,this,e):i.type===1?p=new i.ctor(n,i.name,i.strings,this,e):i.type===6&&(p=new ht(n,this,e)),this._$AV.push(p),i=o[++c]}a!==(i==null?void 0:i.index)&&(n=O.nextNode(),a++)}return O.currentNode=I,r}p(e){let s=0;for(const o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,s),s+=o.strings.length-2):o._$AI(e[s])),s++}}class L{get _$AU(){var e;return((e=this._$AM)==null?void 0:e._$AU)??this._$Cv}constructor(e,s,o,r){this.type=2,this._$AH=u,this._$AN=void 0,this._$AA=e,this._$AB=s,this._$AM=o,this.options=r,this._$Cv=(r==null?void 0:r.isConnected)??!0}get parentNode(){let e=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&(e==null?void 0:e.nodeType)===11&&(e=s.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,s=this){e=R(this,e,s),J(e)?e===u||e==null||e===""?(this._$AH!==u&&this._$AR(),this._$AH=u):e!==this._$AH&&e!==N&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):at(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==u&&J(this._$AH)?this._$AA.nextSibling.data=e:this.T(I.createTextNode(e)),this._$AH=e}$(e){var n;const{values:s,_$litType$:o}=e,r=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=X.createElement(Re(o.h,o.h[0]),this.options)),o);if(((n=this._$AH)==null?void 0:n._$AD)===r)this._$AH.p(s);else{const a=new lt(r,this),c=a.u(this.options);a.p(s),this.T(c),this._$AH=a}}_$AC(e){let s=Te.get(e.strings);return s===void 0&&Te.set(e.strings,s=new X(e)),s}k(e){ve(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let o,r=0;for(const n of e)r===s.length?s.push(o=new L(this.O(G()),this.O(G()),this,this.options)):o=s[r],o._$AI(n),r++;r<s.length&&(this._$AR(o&&o._$AB.nextSibling,r),s.length=r)}_$AR(e=this._$AA.nextSibling,s){var o;for((o=this._$AP)==null?void 0:o.call(this,!1,!0,s);e!==this._$AB;){const r=Se(e).nextSibling;Se(e).remove(),e=r}}setConnected(e){var s;this._$AM===void 0&&(this._$Cv=e,(s=this._$AP)==null||s.call(this,e))}}class ae{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,s,o,r,n){this.type=1,this._$AH=u,this._$AN=void 0,this.element=e,this.name=s,this._$AM=r,this.options=n,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=u}_$AI(e,s=this,o,r){const n=this.strings;let a=!1;if(n===void 0)e=R(this,e,s,0),a=!J(e)||e!==this._$AH&&e!==N,a&&(this._$AH=e);else{const c=e;let i,p;for(e=n[0],i=0;i<n.length-1;i++)p=R(this,c[o+i],s,i),p===N&&(p=this._$AH[i]),a||(a=!J(p)||p!==this._$AH[i]),p===u?e=u:e!==u&&(e+=(p??"")+n[i+1]),this._$AH[i]=p}a&&!r&&this.j(e)}j(e){e===u?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class dt extends ae{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===u?void 0:e}}class pt extends ae{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==u)}}class ut extends ae{constructor(e,s,o,r,n){super(e,s,o,r,n),this.type=5}_$AI(e,s=this){if((e=R(this,e,s,0)??u)===N)return;const o=this._$AH,r=e===u&&o!==u||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,n=e!==u&&(o===u||r);r&&this.element.removeEventListener(this.name,this,o),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){var s;typeof this._$AH=="function"?this._$AH.call(((s=this.options)==null?void 0:s.host)??this.element,e):this._$AH.handleEvent(e)}}class ht{constructor(e,s,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=s,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){R(this,e)}}const mt={I:L},pe=Q.litHtmlPolyfillSupport;pe==null||pe(X,L),(Q.litHtmlVersions??(Q.litHtmlVersions=[])).push("3.3.2");const ft=(t,e,s)=>{const o=(s==null?void 0:s.renderBefore)??e;let r=o._$litPart$;if(r===void 0){const n=(s==null?void 0:s.renderBefore)??null;o._$litPart$=r=new L(e.insertBefore(G(),n),n,void 0,s??{})}return r._$AI(t),r};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const P=globalThis;let w=class extends D{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var s;const e=super.createRenderRoot();return(s=this.renderOptions).renderBefore??(s.renderBefore=e.firstChild),e}update(e){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=ft(s,this.renderRoot,this.renderOptions)}connectedCallback(){var e;super.connectedCallback(),(e=this._$Do)==null||e.setConnected(!0)}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._$Do)==null||e.setConnected(!1)}render(){return N}};var Ne;w._$litElement$=!0,w.finalized=!0,(Ne=P.litElementHydrateSupport)==null||Ne.call(P,{LitElement:w});const ue=P.litElementPolyfillSupport;ue==null||ue({LitElement:w});(P.litElementVersions??(P.litElementVersions=[])).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const F=t=>(e,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const gt={attribute:!0,type:String,converter:oe,reflect:!1,hasChanged:ge},vt=(t=gt,e,s)=>{const{kind:o,metadata:r}=s;let n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),o==="setter"&&((t=Object.create(t)).wrapped=!0),n.set(s.name,t),o==="accessor"){const{name:a}=s;return{set(c){const i=e.get.call(this);e.set.call(this,c),this.requestUpdate(a,i,t,!0,c)},init(c){return c!==void 0&&this.C(a,void 0,t,c),c}}}if(o==="setter"){const{name:a}=s;return function(c){const i=this[a];e.call(this,c),this.requestUpdate(a,i,t,!0,c)}}throw Error("Unsupported decorator location: "+o)};function C(t){return(e,s)=>typeof s=="object"?vt(t,e,s):((o,r,n)=>{const a=r.hasOwnProperty(n);return r.constructor.createProperty(n,o),a?Object.getOwnPropertyDescriptor(r,n):void 0})(t,e,s)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function b(t){return C({...t,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const bt=(t,e,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&typeof e!="object"&&Object.defineProperty(t,e,s),s);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function yt(t,e){return(s,o,r)=>{const n=a=>{var c;return((c=a.renderRoot)==null?void 0:c.querySelector(t))??null};return bt(s,o,{get(){return n(this)}})}}class Y{constructor(e,s,o){this.unsubscribeFns=[],this.host=e,this.eventKinds=s,this.handler=o,e.addController(this)}hostConnected(){const e=$.getInstance();this.unsubscribeFns=this.eventKinds.map(s=>e.subscribe(s,o=>{this.handler(o),this.host.requestUpdate()}))}hostDisconnected(){for(const e of this.unsubscribeFns)e();this.unsubscribeFns=[]}hostUpdated(){}}function xt(){return{sessionKeys:[],eventKinds:[],models:[],showErrors:!0,pauseFeed:!1}}var $t=Object.defineProperty,wt=Object.getOwnPropertyDescriptor,He=(t,e,s,o)=>{for(var r=o>1?void 0:o?wt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&$t(e,s,r),r};let ne=class extends w{constructor(){super(...arguments),this.status="disconnected"}connectedCallback(){super.connectedCallback();const t=$.getInstance();this.status=t.getStatus(),this.removeStatusListener=t.onStatusChange(e=>{this.status=e})}disconnectedCallback(){var t;super.disconnectedCallback(),(t=this.removeStatusListener)==null||t.call(this)}get label(){switch(this.status){case"connected":return"Connected";case"connecting":return"Connecting…";case"disconnected":return"Disconnected";case"error":return"Connection error"}}render(){return h`
      <span
        class="dot dot--${this.status}"
        aria-hidden="true"
      ></span>
      <span class="label">${this.label}</span>
    `}updated(t){this.setAttribute("aria-label",`Gateway: ${this.label}`)}};ne.styles=H`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-muted, #6b7280);
      user-select: none;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: var(--oc-radius-full, 9999px);
      flex-shrink: 0;
      transition: background-color var(--oc-transition-fast, 150ms ease);
    }

    /* Status-specific dot colours */
    .dot--connected    { background: var(--oc-color-running, #22c55e); }
    .dot--connecting   { background: var(--oc-color-waiting, #f59e0b);
                         animation: oc-pulse 1.2s ease-in-out infinite; }
    .dot--disconnected { background: var(--oc-color-idle, #9ca3af); }
    .dot--error        { background: var(--oc-color-error, #ef4444); }

    .label {
      transition: color var(--oc-transition-fast, 150ms ease);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.35; }
    }
  `;He([b()],ne.prototype,"status",2);ne=He([F("oc-ws-status")],ne);var St=Object.defineProperty,kt=Object.getOwnPropertyDescriptor,W=(t,e,s,o)=>{for(var r=o>1?void 0:o?kt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&St(e,s,r),r};let K=class extends w{constructor(){super(...arguments),this.metrics={activeSessions:0,tokensThisHour:0,activeToolCalls:0,errorCount:0,lastUpdated:new Date().toISOString()},this.localActiveToolCalls=0,this.localErrorCount=0,this.localSessionCount=0,this.localTokensThisHour=0,this.tokenWindowStart=Date.now(),this.wsCtrl=new Y(this,["session.created","session.destroyed","run.completed","run.aborted","tool.started","tool.completed"],t=>this.handleMetricEvent(t))}handleMetricEvent(t){switch(Date.now()-this.tokenWindowStart>36e5&&(this.tokenWindowStart=Date.now(),this.localTokensThisHour=0),t.eventKind){case"session.created":this.localSessionCount++;break;case"session.destroyed":this.localSessionCount=Math.max(0,this.localSessionCount-1);break;case"tool.started":this.localActiveToolCalls++;break;case"tool.completed":this.localActiveToolCalls=Math.max(0,this.localActiveToolCalls-1),t.success||this.localErrorCount++;break;case"run.completed":{const e=t.tokenCounts;e!=null&&e.totalTokens&&(this.localTokensThisHour+=e.totalTokens);break}case"run.aborted":this.localErrorCount++;break}}render(){const t=this.localSessionCount||this.metrics.activeSessions,e=this.localTokensThisHour||this.metrics.tokensThisHour,s=this.localActiveToolCalls||this.metrics.activeToolCalls,o=this.localErrorCount||this.metrics.errorCount;return h`
      <span class="brand">⚡ OpenClaw</span>
      <div class="metrics" role="status" aria-label="Resource metrics">
        <span class="metric">
          <span>Sessions</span>
          <span class="metric-value ${t>0?"active":""}" aria-label="${t} active sessions">
            ${t}
          </span>
        </span>
        <span class="divider" aria-hidden="true"></span>
        <span class="metric hide-sm">
          <span>Tokens/hr</span>
          <span class="metric-value" aria-label="${e.toLocaleString()} tokens this hour">
            ${e>=1e3?`${(e/1e3).toFixed(1)}k`:e}
          </span>
        </span>
        <span class="divider hide-sm" aria-hidden="true"></span>
        <span class="metric">
          <span>Tools</span>
          <span class="metric-value ${s>0?"active":""}" aria-label="${s} active tool calls">
            ${s}
          </span>
        </span>
        <span class="divider" aria-hidden="true"></span>
        <span class="metric">
          <span>Errors</span>
          <span class="metric-value ${o>0?"error":""}" aria-label="${o} errors">
            ${o}
          </span>
        </span>
      </div>
      <oc-ws-status></oc-ws-status>
    `}};K.styles=H`
    :host {
      display: flex;
      align-items: center;
      gap: var(--oc-space-md, 16px);
      padding: 0 var(--oc-space-md, 16px);
      height: 48px;
      background: var(--oc-color-bg-secondary, #f9fafb);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      flex-shrink: 0;
    }

    .brand {
      font-weight: var(--oc-font-weight-bold, 700);
      color: var(--oc-color-accent, #6366f1);
      letter-spacing: -0.02em;
      margin-right: var(--oc-space-sm, 8px);
      white-space: nowrap;
    }

    .metrics {
      display: flex;
      gap: var(--oc-space-md, 16px);
      flex: 1;
      flex-wrap: wrap;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      color: var(--oc-color-text-muted, #6b7280);
      white-space: nowrap;
    }

    .metric-value {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-primary, #111827);
    }

    .metric-value.error {
      color: var(--oc-color-error, #ef4444);
    }

    .metric-value.active {
      color: var(--oc-color-running, #22c55e);
    }

    .divider {
      width: 1px;
      height: 20px;
      background: var(--oc-color-border, #e5e7eb);
      flex-shrink: 0;
    }

    oc-ws-status {
      margin-left: auto;
      flex-shrink: 0;
    }

    /* Responsive: hide less important metrics on narrow screens */
    @media (max-width: 600px) {
      .hide-sm { display: none; }
    }
  `;W([C({type:Object})],K.prototype,"metrics",2);W([b()],K.prototype,"localActiveToolCalls",2);W([b()],K.prototype,"localErrorCount",2);W([b()],K.prototype,"localSessionCount",2);W([b()],K.prototype,"localTokensThisHour",2);K=W([F("oc-resource-bar")],K);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _t={CHILD:2},At=t=>(...e)=>({_$litDirective$:t,values:e});let Kt=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,s,o){this._$Ct=e,this._$AM=s,this._$Ci=o}_$AS(e,s){return this.update(e,s)}update(e,s){return this.render(...s)}};/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{I:Ct}=mt,Ee=t=>t,Me=()=>document.createComment(""),q=(t,e,s)=>{var n;const o=t._$AA.parentNode,r=e===void 0?t._$AB:e._$AA;if(s===void 0){const a=o.insertBefore(Me(),r),c=o.insertBefore(Me(),r);s=new Ct(a,c,t,t.options)}else{const a=s._$AB.nextSibling,c=s._$AM,i=c!==t;if(i){let p;(n=s._$AQ)==null||n.call(s,t),s._$AM=t,s._$AP!==void 0&&(p=t._$AU)!==c._$AU&&s._$AP(p)}if(a!==r||i){let p=s._$AA;for(;p!==a;){const v=Ee(p).nextSibling;Ee(o).insertBefore(p,r),p=v}}}return s},E=(t,e,s=t)=>(t._$AI(e,s),t),Tt={},Et=(t,e=Tt)=>t._$AH=e,Mt=t=>t._$AH,he=t=>{t._$AR(),t._$AA.remove()};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Oe=(t,e,s)=>{const o=new Map;for(let r=e;r<=s;r++)o.set(t[r],r);return o},Le=At(class extends Kt{constructor(t){if(super(t),t.type!==_t.CHILD)throw Error("repeat() can only be used in text expressions")}dt(t,e,s){let o;s===void 0?s=e:e!==void 0&&(o=e);const r=[],n=[];let a=0;for(const c of t)r[a]=o?o(c,a):a,n[a]=s(c,a),a++;return{values:n,keys:r}}render(t,e,s){return this.dt(t,e,s).values}update(t,[e,s,o]){const r=Mt(t),{values:n,keys:a}=this.dt(e,s,o);if(!Array.isArray(r))return this.ut=a,n;const c=this.ut??(this.ut=[]),i=[];let p,v,d=0,g=r.length-1,f=0,y=n.length-1;for(;d<=g&&f<=y;)if(r[d]===null)d++;else if(r[g]===null)g--;else if(c[d]===a[f])i[f]=E(r[d],n[f]),d++,f++;else if(c[g]===a[y])i[y]=E(r[g],n[y]),g--,y--;else if(c[d]===a[y])i[y]=E(r[d],n[y]),q(t,i[y+1],r[d]),d++,y--;else if(c[g]===a[f])i[f]=E(r[g],n[f]),q(t,r[d],r[g]),g--,f++;else if(p===void 0&&(p=Oe(a,f,y),v=Oe(c,d,g)),p.has(c[d]))if(p.has(c[g])){const k=v.get(a[f]),ie=k!==void 0?r[k]:null;if(ie===null){const be=q(t,r[d]);E(be,n[f]),i[f]=be}else i[f]=E(ie,n[f]),q(t,r[d],ie),r[k]=null;f++}else he(r[g]),g--;else he(r[d]),d++;for(;f<=y;){const k=q(t,i[y+1]);E(k,n[f]),i[f++]=k}for(;d<=g;){const k=r[d++];k!==null&&he(k)}return this.ut=a,Et(t,i),N}});class Ot{constructor(){this.childrenMap=new Map,this.parentMap=new Map,this.allSessions=new Set}registerSession(e,s){if(this.allSessions.add(e),s){this.parentMap.set(e,s),this.allSessions.add(s);const o=this.childrenMap.get(s)??[];o.includes(e)||(o.push(e),this.childrenMap.set(s,o))}}removeSession(e){this.allSessions.delete(e);const s=this.parentMap.get(e);if(s){const r=this.childrenMap.get(s)??[];this.childrenMap.set(s,r.filter(n=>n!==e)),this.parentMap.delete(e)}const o=this.childrenMap.get(e)??[];for(const r of o)this.parentMap.delete(r);this.childrenMap.delete(e)}getChildren(e){return this.childrenMap.get(e)??[]}getParent(e){return this.parentMap.get(e)}getRoots(){return[...this.allSessions].filter(e=>!this.parentMap.has(e))}getLineageTree(e){const s=this.getChildren(e);return{sessionKey:e,children:s.map(o=>this.getLineageTree(o))}}getAllSessionKeys(){return[...this.allSessions]}has(e){return this.allSessions.has(e)}}var Pt=Object.defineProperty,It=Object.getOwnPropertyDescriptor,Z=(t,e,s,o)=>{for(var r=o>1?void 0:o?It(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&Pt(e,s,r),r};let z=class extends w{constructor(){super(...arguments),this.sessions=[],this.selectedKey="",this.expandedKeys=new Set,this.focusedKey="",this.lineage=new Ot,this.wsCtrl=new Y(this,["session.created","session.destroyed","run.started","run.completed","run.aborted","subagent.spawned","subagent.completed"],t=>this.handleActivityEvent(t))}handleActivityEvent(t){t.eventKind==="session.created"?this.lineage.registerSession(t.sessionKey,t.parentSessionKey):t.eventKind==="session.destroyed"?this.lineage.removeSession(t.sessionKey):t.eventKind==="subagent.spawned"&&this.lineage.registerSession(t.childSessionKey,t.parentSessionKey)}buildTree(){const t=new Map(this.sessions.map(o=>[o.sessionKey,o]));for(const o of this.sessions)this.lineage.registerSession(o.sessionKey,o.parentSessionKey);const e=this.sessions.filter(o=>!o.parentSessionKey),s=o=>{const r=(o.childSessionKeys??[]).map(n=>t.get(n)).filter(n=>n!==void 0).map(s);return{summary:o,children:r,expanded:this.expandedKeys.has(o.sessionKey)}};return e.map(s)}toggleExpand(t,e){e.stopPropagation();const s=new Set(this.expandedKeys);s.has(t)?s.delete(t):s.add(t),this.expandedKeys=s}selectSession(t){this.focusedKey=t,this.dispatchEvent(new CustomEvent("session-selected",{detail:{sessionKey:t},bubbles:!0,composed:!0}))}handleKeyDown(t,e,s,o){switch(t.key){case"Enter":case" ":t.preventDefault(),this.selectSession(e.summary.sessionKey);break;case"ArrowRight":t.preventDefault(),e.children.length>0&&!e.expanded&&(this.expandedKeys=new Set([...this.expandedKeys,e.summary.sessionKey]));break;case"ArrowLeft":if(t.preventDefault(),e.expanded){const r=new Set(this.expandedKeys);r.delete(e.summary.sessionKey),this.expandedKeys=r}break;case"ArrowDown":t.preventDefault(),o<s.length-1&&(this.focusedKey=s[o+1].summary.sessionKey);break;case"ArrowUp":t.preventDefault(),o>0&&(this.focusedKey=s[o-1].summary.sessionKey);break}}renderTooltip(t){const e=t.uptimeSeconds<60?`${t.uptimeSeconds}s`:`${Math.floor(t.uptimeSeconds/60)}m ${t.uptimeSeconds%60}s`;return h`
      <div class="tooltip" role="tooltip">
        <dl>
          <dt>Session</dt><dd>${t.sessionKey}</dd>
          <dt>Model</dt><dd>${t.model}</dd>
          <dt>Channel</dt><dd>${t.channel}</dd>
          <dt>Uptime</dt><dd>${e}</dd>
          ${t.taskSummary?h`<dt>Task</dt><dd>${t.taskSummary}</dd>`:u}
          <dt>Tokens</dt><dd>${t.tokenAccumulator.totalTokens.toLocaleString()}</dd>
        </dl>
      </div>
    `}renderNodes(t,e=0){return h`
      <ul role="${e===0?"tree":"group"}" aria-label="${e===0?"Active agents":u}">
        ${Le(t,s=>s.summary.sessionKey,(s,o)=>h`
            <li
              role="treeitem"
              aria-expanded="${s.children.length>0?String(s.expanded):u}"
              aria-selected="${s.summary.sessionKey===this.selectedKey}"
              class="tree-item"
            >
              <div
                class="tree-item-row tooltip-wrapper ${s.summary.sessionKey===this.selectedKey?"selected":""}"
                tabindex="${s.summary.sessionKey===this.focusedKey||this.focusedKey===""&&o===0&&e===0?"0":"-1"}"
                @click="${()=>this.selectSession(s.summary.sessionKey)}"
                @keydown="${r=>this.handleKeyDown(r,s,t,o)}"
              >
                ${s.children.length>0?h`
                      <span
                        class="expand-toggle ${s.expanded?"expanded":""}"
                        @click="${r=>this.toggleExpand(s.summary.sessionKey,r)}"
                        aria-label="${s.expanded?"Collapse":"Expand"}"
                      >▶</span>
                    `:h`<span class="expand-placeholder"></span>`}
                <span class="status-badge status-${s.summary.status}" aria-label="Status: ${s.summary.status}"></span>
                <span class="session-label">${s.summary.label??s.summary.sessionKey}</span>
                <span class="session-model">${s.summary.model.split("/").pop()}</span>
                ${this.renderTooltip(s.summary)}
              </div>
              ${s.expanded&&s.children.length>0?this.renderNodes(s.children,e+1):u}
            </li>
          `)}
      </ul>
    `}render(){const t=this.buildTree(),e=this.sessions.filter(s=>s.status==="running").length;return h`
      <div class="tree-header">
        <span>Agents</span>
        <span class="session-count">${this.sessions.length} sessions · ${e} active</span>
      </div>
      ${t.length===0?h`<div class="empty-state">No active sessions</div>`:this.renderNodes(t)}
    `}};z.styles=H`
    :host {
      display: block;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-primary, #111827);
    }

    .tree-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .session-count {
      background: var(--oc-color-bg-tertiary, #f3f4f6);
      border-radius: var(--oc-radius-full, 9999px);
      padding: 2px var(--oc-space-xs, 4px);
      font-size: var(--oc-font-size-xs, 0.75rem);
    }

    ul[role="tree"],
    ul[role="group"] {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    ul[role="group"] {
      padding-left: var(--oc-space-lg, 24px);
    }

    .tree-item {
      position: relative;
    }

    .tree-item-row {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      cursor: pointer;
      outline: none;
      transition: background-color var(--oc-transition-fast, 150ms ease);
    }

    .tree-item-row:hover {
      background: var(--oc-color-bg-secondary, #f9fafb);
    }

    .tree-item-row:focus-visible {
      box-shadow: 0 0 0 2px var(--oc-color-accent, #6366f1);
    }

    .tree-item-row.selected {
      background: var(--oc-color-accent-light, #eef2ff);
      color: var(--oc-color-accent, #6366f1);
    }

    .expand-toggle {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 10px;
      color: var(--oc-color-text-muted, #6b7280);
      transition: transform var(--oc-transition-fast, 150ms ease);
    }

    .expand-toggle.expanded {
      transform: rotate(90deg);
    }

    .expand-placeholder {
      width: 16px;
      flex-shrink: 0;
    }

    /* Status badge */
    .status-badge {
      width: 8px;
      height: 8px;
      border-radius: var(--oc-radius-full, 9999px);
      flex-shrink: 0;
    }

    .status-idle    { background: var(--oc-color-idle,    #9ca3af); }
    .status-running {
      background: var(--oc-color-running, #22c55e);
      animation: oc-pulse 1.5s ease-in-out infinite;
    }
    .status-error   { background: var(--oc-color-error,   #ef4444); }
    .status-waiting { background: var(--oc-color-waiting, #f59e0b); }

    .session-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-model {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-shrink: 0;
    }

    /* Tooltip */
    .tooltip-wrapper {
      position: relative;
    }

    .tooltip-wrapper:hover .tooltip {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .tooltip {
      position: absolute;
      left: 100%;
      top: 0;
      margin-left: var(--oc-space-xs, 4px);
      background: var(--oc-color-bg-primary, #fff);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      border-radius: var(--oc-radius-md, 8px);
      padding: var(--oc-space-sm, 8px);
      min-width: 200px;
      z-index: var(--oc-z-tooltip, 300);
      opacity: 0;
      pointer-events: none;
      transform: translateY(-4px);
      transition: opacity var(--oc-transition-fast, 150ms ease),
                  transform var(--oc-transition-fast, 150ms ease);
      box-shadow: var(--oc-shadow-md);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-secondary, #374151);
      line-height: 1.6;
      white-space: normal;
    }

    .tooltip dt {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      margin-top: var(--oc-space-xs, 4px);
    }

    .tooltip dd {
      margin: 0;
    }

    .empty-state {
      padding: var(--oc-space-xl, 40px) var(--oc-space-md, 16px);
      text-align: center;
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;Z([C({type:Array})],z.prototype,"sessions",2);Z([C({type:String})],z.prototype,"selectedKey",2);Z([b()],z.prototype,"expandedKeys",2);Z([b()],z.prototype,"focusedKey",2);z=Z([F("oc-agent-tree")],z);function Nt(t,e=200){let s=[],o;return r=>{s.push(r),clearTimeout(o),o=setTimeout(()=>{const n=s;s=[],t(n)},e)}}var zt=Object.defineProperty,Ut=Object.getOwnPropertyDescriptor,ee=(t,e,s,o)=>{for(var r=o>1?void 0:o?Ut(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&zt(e,s,r),r};const Pe=500,jt=80,Dt=200;let Ie=0;function Rt(t){Ie++;const e=Ht(t.eventKind),s=Lt(t),o=Ft(t);return{id:`card-${Ie}-${Date.now()}`,sessionKey:t.sessionKey,eventKind:t.eventKind,timestamp:t.timestamp,label:s,detail:o,color:e}}function Ht(t){return t.startsWith("tool.")?"blue":t.startsWith("run.")?"green":t.startsWith("session.")?"purple":t.startsWith("subagent.")?"amber":t.includes("error")||t.includes("abort")?"red":"grey"}function Lt(t){switch(t.eventKind){case"session.created":return"🟢 Session created";case"session.destroyed":return"⚫ Session ended";case"run.started":return"▶ Run started";case"run.completed":return"✅ Run completed";case"run.aborted":return"🛑 Run aborted";case"tool.started":return`🔧 ${t.toolName??"Tool"} started`;case"tool.completed":return`✔ ${t.toolName??"Tool"} done`;case"subagent.spawned":return"🤖 Sub-agent spawned";case"subagent.completed":return"🏁 Sub-agent completed";default:return t.eventKind}}function Ft(t){var e;switch(t.eventKind){case"run.started":return`Model: ${t.model??"?"}${t.taskSummary?` — ${t.taskSummary}`:""}`;case"run.completed":{const s=t.tokenCounts;return s?`${((e=s.totalTokens)==null?void 0:e.toLocaleString())??0} tokens · ${t.durationMs??0}ms`:""}case"run.aborted":return t.reason??"";case"tool.started":return t.argsSummary??"";case"tool.completed":return`${t.durationMs??0}ms — ${t.resultSummary??""}`;case"subagent.spawned":return`Child: ${t.childSessionKey??"?"}${t.label?` (${t.label})`:""}`;default:return""}}function Wt(t){const e=Date.now()-new Date(t).getTime();return e<1e3?"just now":e<6e4?`${Math.floor(e/1e3)}s ago`:e<36e5?`${Math.floor(e/6e4)}m ago`:`${Math.floor(e/36e5)}h ago`}let U=class extends w{constructor(){super(...arguments),this.filter={sessionKeys:[],eventKinds:[],models:[],showErrors:!0,pauseFeed:!1},this.allCards=[],this.scrollOffset=0,this.batchAddCards=Nt(t=>{if(this.filter.pauseFeed)return;const e=[...this.allCards,...t];this.allCards=e.length>Pe?e.slice(e.length-Pe):e,this.scrollToBottom()},Dt),this.wsCtrl=new Y(this,["*"],t=>{const e=Rt(t);this.passesFilter(e)&&this.batchAddCards(e)})}passesFilter(t){const e=this.filter;return!(e.sessionKeys.length>0&&!e.sessionKeys.includes(t.sessionKey)||e.eventKinds.length>0&&!e.eventKinds.includes(t.eventKind)||!e.showErrors&&t.color==="red")}get visibleCards(){const t=this.allCards.filter(e=>this.passesFilter(e));return t.slice(Math.max(0,t.length-jt))}scrollToBottom(){this.filter.pauseFeed||this.updateComplete.then(()=>{const t=this.feedListEl;t&&(t.scrollTop=t.scrollHeight)})}togglePause(){this.dispatchEvent(new CustomEvent("filter-change",{detail:{...this.filter,pauseFeed:!this.filter.pauseFeed},bubbles:!0,composed:!0}))}clearFeed(){this.allCards=[]}renderCard(t){return h`
      <div class="event-card" role="listitem" aria-label="${t.label}">
        <span class="event-stripe stripe-${t.color}"></span>
        <div class="event-header">
          <span class="event-label">${t.label}</span>
          <span class="event-session">${t.sessionKey.slice(0,8)}</span>
          <span class="event-time">${Wt(t.timestamp)}</span>
        </div>
        ${t.detail?h`<div class="event-detail">${t.detail}</div>`:u}
      </div>
    `}render(){const t=this.visibleCards;return h`
      <div class="feed-toolbar">
        <span class="feed-toolbar-title">Activity Feed</span>
        <button
          class="pause-btn ${this.filter.pauseFeed?"paused":""}"
          @click="${this.togglePause}"
          aria-pressed="${this.filter.pauseFeed}"
          title="${this.filter.pauseFeed?"Resume feed":"Pause feed"}"
        >
          ${this.filter.pauseFeed?"▶ Resume":"⏸ Pause"}
        </button>
        <button class="clear-btn" @click="${this.clearFeed}" title="Clear feed">
          Clear
        </button>
      </div>
      <div
        class="feed-list"
        role="list"
        aria-label="Agent activity feed"
        aria-live="polite"
        aria-atomic="false"
      >
        ${t.length===0?h`<div class="feed-empty">No events yet — waiting for activity…</div>`:Le(t,e=>e.id,e=>this.renderCard(e))}
      </div>
    `}};U.styles=H`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      background: var(--oc-color-bg-primary, #fff);
    }

    .feed-toolbar {
      display: flex;
      align-items: center;
      gap: var(--oc-space-sm, 8px);
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      flex-wrap: wrap;
    }

    .feed-toolbar-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: var(--oc-font-size-xs, 0.75rem);
      flex: 1;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-full, 9999px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: var(--oc-color-bg-secondary, #f9fafb);
      color: var(--oc-color-text-secondary, #374151);
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .filter-chip:hover,
    .filter-chip.active {
      background: var(--oc-color-accent-light, #eef2ff);
      border-color: var(--oc-color-accent, #6366f1);
      color: var(--oc-color-accent, #6366f1);
    }

    .pause-btn {
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: var(--oc-color-bg-tertiary, #f3f4f6);
      color: var(--oc-color-text-secondary, #374151);
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .pause-btn.paused {
      background: var(--oc-color-waiting, #f59e0b);
      color: #fff;
      border-color: transparent;
    }

    .clear-btn {
      padding: 2px var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
      cursor: pointer;
      background: transparent;
      color: var(--oc-color-text-muted, #6b7280);
    }

    .feed-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--oc-space-xs, 4px) 0;
      scroll-behavior: smooth;
    }

    .feed-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .event-card {
      display: grid;
      grid-template-columns: 4px 1fr;
      gap: 0 var(--oc-space-sm, 8px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-md, 16px) var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      margin: 2px var(--oc-space-sm, 8px);
      animation: oc-slide-in var(--oc-transition-normal, 300ms) ease forwards;
      transition: background var(--oc-transition-fast, 150ms ease);
    }

    .event-card:hover {
      background: var(--oc-color-bg-secondary, #f9fafb);
    }

    .event-stripe {
      border-radius: 2px;
      grid-row: 1 / 3;
      align-self: stretch;
    }

    .stripe-green  { background: var(--oc-color-running, #22c55e); }
    .stripe-blue   { background: var(--oc-color-event-tool, #3b82f6); }
    .stripe-amber  { background: var(--oc-color-waiting, #f59e0b); }
    .stripe-red    { background: var(--oc-color-error, #ef4444); }
    .stripe-purple { background: var(--oc-color-event-chat, #8b5cf6); }
    .stripe-grey   { background: var(--oc-color-idle, #9ca3af); }

    .event-header {
      display: flex;
      align-items: baseline;
      gap: var(--oc-space-xs, 4px);
    }

    .event-label {
      font-weight: var(--oc-font-weight-medium, 500);
      color: var(--oc-color-text-primary, #111827);
      flex: 1;
    }

    .event-session {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      font-family: var(--oc-font-mono, monospace);
    }

    .event-time {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-shrink: 0;
    }

    .event-detail {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      font-family: var(--oc-font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @keyframes oc-slide-in {
      from { opacity: 0; transform: translateX(8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `;ee([C({type:Object})],U.prototype,"filter",2);ee([b()],U.prototype,"allCards",2);ee([b()],U.prototype,"scrollOffset",2);ee([yt(".feed-list")],U.prototype,"feedListEl",2);U=ee([F("oc-activity-feed")],U);var Bt=Object.defineProperty,qt=Object.getOwnPropertyDescriptor,S=(t,e,s,o)=>{for(var r=o>1?void 0:o?qt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&Bt(e,s,r),r};let x=class extends w{constructor(){super(...arguments),this.session=null,this.toolCalls=[],this.streamingOutput="",this.expandedToolCallIds=new Set,this.showAbortConfirm=!1,this.steerText="",this.injectText="",this.showSteerInput=!1,this.showInjectInput=!1,this.wsCtrl=new Y(this,["run.started","run.completed","run.aborted","tool.started","tool.completed"],t=>this.handleEvent(t))}handleEvent(t){!this.session||t.sessionKey!==this.session.sessionKey||this.requestUpdate()}toggleToolCall(t){const e=new Set(this.expandedToolCallIds);e.has(t)?e.delete(t):e.add(t),this.expandedToolCallIds=e}handleAbort(){this.showAbortConfirm=!0}confirmAbort(){this.session&&($.getInstance().send({type:"chat.abort",sessionKey:this.session.sessionKey}),this.showAbortConfirm=!1,this.dispatchEvent(new CustomEvent("session-aborted",{detail:{sessionKey:this.session.sessionKey},bubbles:!0,composed:!0})))}handleSteer(){!this.session||!this.steerText.trim()||($.getInstance().send({type:"sessions.send",sessionKey:this.session.sessionKey,message:this.steerText.trim()}),this.steerText="",this.showSteerInput=!1)}handleInject(){!this.session||!this.injectText.trim()||($.getInstance().send({type:"chat.inject",sessionKey:this.session.sessionKey,message:this.injectText.trim()}),this.injectText="",this.showInjectInput=!1)}navigateTo(t){this.dispatchEvent(new CustomEvent("session-selected",{detail:{sessionKey:t},bubbles:!0,composed:!0}))}renderBreadcrumb(){const t=this.session,e=[];t.parentSessionKey&&e.push(h`
        <span
          class="breadcrumb-item"
          @click="${()=>this.navigateTo(t.parentSessionKey)}"
          tabindex="0"
          role="button"
          @keydown="${s=>{s.key==="Enter"&&this.navigateTo(t.parentSessionKey)}}"
        >${t.parentSessionKey.slice(0,10)}…</span>
        <span class="breadcrumb-sep">›</span>
      `),e.push(h`<span class="breadcrumb-item current">${t.label??t.sessionKey.slice(0,14)}…</span>`);for(const s of t.childSessionKeys??[])e.push(h`
        <span class="breadcrumb-sep">›</span>
        <span
          class="breadcrumb-item"
          @click="${()=>this.navigateTo(s)}"
          tabindex="0"
          role="button"
          @keydown="${o=>{o.key==="Enter"&&this.navigateTo(s)}}"
        >${s.slice(0,10)}…</span>
      `);return h`<div class="breadcrumb" aria-label="Session lineage">${e}</div>`}renderToolCallItem(t){const e=this.expandedToolCallIds.has(t.id);return h`
      <div class="tool-call-item" role="listitem">
        <div
          class="tool-call-header"
          @click="${()=>this.toggleToolCall(t.id)}"
          tabindex="0"
          role="button"
          aria-expanded="${e}"
          @keydown="${s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),this.toggleToolCall(t.id))}}"
        >
          <span class="tool-status-dot tool-${t.status}"></span>
          <span class="tool-name">${t.toolName}</span>
          ${t.durationMs!=null?h`<span class="tool-duration">${t.durationMs}ms</span>`:u}
          <span class="tool-expand-icon ${e?"expanded":""}">▶</span>
        </div>
        ${e?h`
              <div class="tool-call-body">
                <div class="tool-call-section-label">Args</div>
                <pre class="tool-call-text">${t.args}</pre>
                ${t.result?h`
                      <div class="tool-call-section-label">Result</div>
                      <pre class="tool-call-text">${t.result}</pre>
                    `:u}
              </div>
            `:u}
      </div>
    `}render(){if(!this.session)return h`<div class="empty-state">Select a session to inspect</div>`;const t=this.session,e=t.tokenAccumulator,s=e.estimatedCostUsd!=null?`$${e.estimatedCostUsd.toFixed(4)}`:null;return h`
      <!-- Abort confirmation dialog -->
      ${this.showAbortConfirm?h`
            <div class="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm abort">
              <div class="confirm-dialog">
                <h3>Abort session?</h3>
                <p>This will immediately stop the running agent. This action cannot be undone.</p>
                <div class="confirm-actions">
                  <button class="btn btn-cancel" @click="${()=>{this.showAbortConfirm=!1}}">Cancel</button>
                  <button class="btn btn-abort" @click="${this.confirmAbort}">Abort</button>
                </div>
              </div>
            </div>
          `:u}

      <div class="panel-header">
        <div class="panel-title">
          <span class="status-badge status-${t.status}" aria-label="Status: ${t.status}"></span>
          ${t.label??t.sessionKey}
        </div>
        ${this.renderBreadcrumb()}
      </div>

      <!-- Meta -->
      <dl class="meta-grid">
        <dt class="meta-key">Session</dt>
        <dd class="meta-val">${t.sessionKey}</dd>
        <dt class="meta-key">Model</dt>
        <dd class="meta-val">${t.model}</dd>
        <dt class="meta-key">Channel</dt>
        <dd class="meta-val">${t.channel}</dd>
        ${t.taskSummary?h`<dt class="meta-key">Task</dt><dd class="meta-val">${t.taskSummary}</dd>`:u}
      </dl>

      <!-- Token bar -->
      <div class="token-bar" aria-label="Token usage">
        <span class="token-stat">In: <strong>${e.inputTokens.toLocaleString()}</strong></span>
        <span class="token-stat">Out: <strong>${e.outputTokens.toLocaleString()}</strong></span>
        <span class="token-stat">Total: <strong>${e.totalTokens.toLocaleString()}</strong></span>
        ${s?h`<span class="token-stat">Cost: <strong>${s}</strong></span>`:u}
      </div>

      <!-- Streaming output -->
      ${this.streamingOutput?h`
            <div class="section">
              <div class="section-title">Live output</div>
              <pre class="stream-output" aria-live="polite" aria-atomic="false">${this.streamingOutput}</pre>
            </div>
          `:u}

      <!-- Tool calls -->
      ${this.toolCalls.length>0?h`
            <div class="section">
              <div class="section-title">Tool calls (${this.toolCalls.length})</div>
              <div role="list" aria-label="Tool call log">
                ${this.toolCalls.map(o=>this.renderToolCallItem(o))}
              </div>
            </div>
          `:u}

      <!-- Actions -->
      <div class="actions">
        <button
          class="btn btn-abort"
          @click="${this.handleAbort}"
          aria-label="Abort session"
          ?disabled="${t.status==="idle"}"
        >🛑 Abort</button>
        <button
          class="btn btn-steer"
          @click="${()=>{this.showSteerInput=!this.showSteerInput}}"
          aria-label="Steer session"
          aria-expanded="${this.showSteerInput}"
        >↩ Steer</button>
        <button
          class="btn btn-inject"
          @click="${()=>{this.showInjectInput=!this.showInjectInput}}"
          aria-label="Inject message"
          aria-expanded="${this.showInjectInput}"
        >💉 Inject</button>
      </div>

      ${this.showSteerInput?h`
            <div class="input-row">
              <input
                class="text-input"
                type="text"
                placeholder="Send steering message…"
                .value="${this.steerText}"
                @input="${o=>{this.steerText=o.target.value}}"
                @keydown="${o=>{o.key==="Enter"&&this.handleSteer(),o.key==="Escape"&&(this.showSteerInput=!1)}}"
                aria-label="Steering message"
              />
              <button class="btn-send" @click="${this.handleSteer}">Send</button>
            </div>
          `:u}

      ${this.showInjectInput?h`
            <div class="input-row">
              <input
                class="text-input"
                type="text"
                placeholder="Inject system message…"
                .value="${this.injectText}"
                @input="${o=>{this.injectText=o.target.value}}"
                @keydown="${o=>{o.key==="Enter"&&this.handleInject(),o.key==="Escape"&&(this.showInjectInput=!1)}}"
                aria-label="Inject message"
              />
              <button class="btn-send" @click="${this.handleInject}">Send</button>
            </div>
          `:u}
    `}};x.styles=H`
    :host {
      display: block;
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
      color: var(--oc-color-text-primary, #111827);
      height: 100%;
      overflow-y: auto;
      background: var(--oc-color-bg-primary, #fff);
    }

    .panel-header {
      position: sticky;
      top: 0;
      background: var(--oc-color-bg-primary, #fff);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      padding: var(--oc-space-md, 16px);
      z-index: 10;
    }

    .panel-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-md, 1rem);
      margin-bottom: var(--oc-space-xs, 4px);
      display: flex;
      align-items: center;
      gap: var(--oc-space-sm, 8px);
    }

    .status-badge {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-idle    { background: var(--oc-color-idle,    #9ca3af); }
    .status-running { background: var(--oc-color-running, #22c55e);
                      animation: oc-pulse 1.5s infinite; }
    .status-error   { background: var(--oc-color-error,   #ef4444); }
    .status-waiting { background: var(--oc-color-waiting, #f59e0b); }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      flex-wrap: wrap;
      margin-top: var(--oc-space-xs, 4px);
    }

    .breadcrumb-sep { opacity: 0.5; }

    .breadcrumb-item {
      cursor: pointer;
      color: var(--oc-color-accent, #6366f1);
      text-decoration: underline;
    }

    .breadcrumb-item.current {
      cursor: default;
      color: var(--oc-color-text-primary, #111827);
      text-decoration: none;
      font-weight: var(--oc-font-weight-medium, 500);
    }

    /* ─── Meta grid ─────────────────────────────────────────────────── */

    .meta-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--oc-space-xs, 4px) var(--oc-space-md, 16px);
      padding: var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      font-size: var(--oc-font-size-xs, 0.75rem);
    }

    .meta-key {
      color: var(--oc-color-text-muted, #6b7280);
      font-weight: var(--oc-font-weight-medium, 500);
    }

    .meta-val {
      color: var(--oc-color-text-primary, #111827);
      font-family: var(--oc-font-mono, monospace);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ─── Token bar ─────────────────────────────────────────────────── */

    .token-bar {
      padding: var(--oc-space-sm, 8px) var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
      display: flex;
      gap: var(--oc-space-md, 16px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
    }

    .token-stat strong {
      color: var(--oc-color-text-primary, #111827);
      font-weight: var(--oc-font-weight-semibold, 600);
    }

    /* ─── Streaming output ──────────────────────────────────────────── */

    .section {
      padding: var(--oc-space-md, 16px);
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
    }

    .section-title {
      font-weight: var(--oc-font-weight-semibold, 600);
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--oc-space-sm, 8px);
    }

    .stream-output {
      background: var(--oc-color-bg-secondary, #f9fafb);
      border-radius: var(--oc-radius-md, 8px);
      padding: var(--oc-space-sm, 8px);
      font-family: var(--oc-font-mono, monospace);
      font-size: var(--oc-font-size-xs, 0.75rem);
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--oc-color-text-secondary, #374151);
    }

    /* ─── Tool calls ────────────────────────────────────────────────── */

    .tool-call-item {
      border: 1px solid var(--oc-color-border, #e5e7eb);
      border-radius: var(--oc-radius-sm, 4px);
      margin-bottom: var(--oc-space-xs, 4px);
      overflow: hidden;
    }

    .tool-call-header {
      display: flex;
      align-items: center;
      gap: var(--oc-space-xs, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      cursor: pointer;
      background: var(--oc-color-bg-secondary, #f9fafb);
      transition: background var(--oc-transition-fast, 150ms);
    }

    .tool-call-header:hover {
      background: var(--oc-color-bg-tertiary, #f3f4f6);
    }

    .tool-name {
      font-family: var(--oc-font-mono, monospace);
      font-weight: var(--oc-font-weight-medium, 500);
      flex: 1;
    }

    .tool-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .tool-running { background: var(--oc-color-waiting, #f59e0b); animation: oc-pulse 1s infinite; }
    .tool-success { background: var(--oc-color-running, #22c55e); }
    .tool-error   { background: var(--oc-color-error,   #ef4444); }

    .tool-duration {
      font-size: var(--oc-font-size-xs, 0.75rem);
      color: var(--oc-color-text-muted, #6b7280);
    }

    .tool-expand-icon {
      font-size: 10px;
      color: var(--oc-color-text-muted, #6b7280);
      transition: transform var(--oc-transition-fast, 150ms);
    }

    .tool-expand-icon.expanded {
      transform: rotate(90deg);
    }

    .tool-call-body {
      padding: var(--oc-space-sm, 8px);
      font-size: var(--oc-font-size-xs, 0.75rem);
      font-family: var(--oc-font-mono, monospace);
      background: var(--oc-color-bg-primary, #fff);
    }

    .tool-call-section-label {
      font-weight: var(--oc-font-weight-semibold, 600);
      color: var(--oc-color-text-muted, #6b7280);
      margin-bottom: 2px;
    }

    .tool-call-text {
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--oc-color-text-secondary, #374151);
      margin-bottom: var(--oc-space-xs, 4px);
    }

    /* ─── Action buttons ────────────────────────────────────────────── */

    .actions {
      padding: var(--oc-space-md, 16px);
      display: flex;
      gap: var(--oc-space-sm, 8px);
      flex-wrap: wrap;
      border-bottom: 1px solid var(--oc-color-border, #e5e7eb);
    }

    .btn {
      padding: var(--oc-space-xs, 4px) var(--oc-space-md, 16px);
      border-radius: var(--oc-radius-sm, 4px);
      border: 1px solid transparent;
      cursor: pointer;
      font-size: var(--oc-font-size-sm, 0.875rem);
      font-weight: var(--oc-font-weight-medium, 500);
      transition: background var(--oc-transition-fast, 150ms), opacity var(--oc-transition-fast, 150ms);
    }

    .btn-abort {
      background: var(--oc-color-error, #ef4444);
      color: white;
    }

    .btn-abort:hover { opacity: 0.85; }

    .btn-steer {
      background: var(--oc-color-accent, #6366f1);
      color: white;
    }

    .btn-steer:hover { opacity: 0.85; }

    .btn-inject {
      background: transparent;
      border-color: var(--oc-color-accent, #6366f1);
      color: var(--oc-color-accent, #6366f1);
    }

    .btn-inject:hover {
      background: var(--oc-color-accent-light, #eef2ff);
    }

    .input-row {
      padding: 0 var(--oc-space-md, 16px) var(--oc-space-md, 16px);
      display: flex;
      gap: var(--oc-space-sm, 8px);
    }

    .text-input {
      flex: 1;
      border: 1px solid var(--oc-color-border-strong, #d1d5db);
      border-radius: var(--oc-radius-sm, 4px);
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      font-family: var(--oc-font-sans, sans-serif);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .btn-send {
      padding: var(--oc-space-xs, 4px) var(--oc-space-sm, 8px);
      border-radius: var(--oc-radius-sm, 4px);
      border: none;
      background: var(--oc-color-accent, #6366f1);
      color: white;
      cursor: pointer;
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    /* ─── Confirm dialog ────────────────────────────────────────────── */

    .confirm-overlay {
      position: fixed;
      inset: 0;
      background: var(--oc-color-bg-overlay, rgba(0,0,0,0.4));
      z-index: var(--oc-z-modal, 200);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .confirm-dialog {
      background: var(--oc-color-bg-primary, #fff);
      border-radius: var(--oc-radius-lg, 12px);
      padding: var(--oc-space-lg, 24px);
      max-width: 400px;
      width: 90%;
      box-shadow: var(--oc-shadow-lg);
    }

    .confirm-dialog h3 {
      margin: 0 0 var(--oc-space-sm, 8px);
      font-size: var(--oc-font-size-md, 1rem);
    }

    .confirm-dialog p {
      margin: 0 0 var(--oc-space-md, 16px);
      color: var(--oc-color-text-muted, #6b7280);
      font-size: var(--oc-font-size-sm, 0.875rem);
    }

    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--oc-space-sm, 8px);
    }

    .btn-cancel {
      background: var(--oc-color-bg-secondary, #f9fafb);
      border: 1px solid var(--oc-color-border, #e5e7eb);
      color: var(--oc-color-text-secondary, #374151);
    }

    /* ─── Empty state ────────────────────────────────────────────────── */

    .empty-state {
      padding: var(--oc-space-xl, 40px);
      text-align: center;
      color: var(--oc-color-text-muted, #6b7280);
    }

    @keyframes oc-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;S([C({type:Object})],x.prototype,"session",2);S([C({type:Array})],x.prototype,"toolCalls",2);S([C({type:String})],x.prototype,"streamingOutput",2);S([b()],x.prototype,"expandedToolCallIds",2);S([b()],x.prototype,"showAbortConfirm",2);S([b()],x.prototype,"steerText",2);S([b()],x.prototype,"injectText",2);S([b()],x.prototype,"showSteerInput",2);S([b()],x.prototype,"showInjectInput",2);x=S([F("oc-session-detail")],x);var Vt=Object.defineProperty,Qt=Object.getOwnPropertyDescriptor,te=(t,e,s,o)=>{for(var r=o>1?void 0:o?Qt(e,s):e,n=t.length-1,a;n>=0;n--)(a=t[n])&&(r=(o?a(e,s,r):a(r))||r);return o&&r&&Vt(e,s,r),r};const Gt=window.OPENCLAW_GATEWAY_WS??"ws://localhost:4000";let j=class extends w{constructor(){super(...arguments),this.sessions=[],this.selectedSessionKey="",this.filter=xt(),this.metrics={activeSessions:0,tokensThisHour:0,activeToolCalls:0,errorCount:0,lastUpdated:new Date().toISOString()},this.sessionMap=new Map,this.wsCtrl=new Y(this,["session.created","session.destroyed","run.started","run.completed","run.aborted","tool.started","tool.completed","subagent.spawned","subagent.completed"],t=>this.handleGatewayEvent(t))}connectedCallback(){super.connectedCallback(),new URLSearchParams(window.location.search).has("demo")||window.location.hostname==="localhost"?setTimeout(()=>Ge(),800):($.getInstance().connect(Gt),$.getInstance().send({type:"sessions.list"}))}handleGatewayEvent(t){switch(t.eventKind){case"session.created":this.upsertSession({sessionKey:t.sessionKey,model:t.model,channel:t.channel,label:t.label,status:"idle",createdAt:t.timestamp,uptimeSeconds:0,parentSessionKey:t.parentSessionKey,childSessionKeys:[],tokenAccumulator:{inputTokens:0,outputTokens:0,totalTokens:0}});break;case"session.destroyed":this.removeSession(t.sessionKey);break;case"run.started":this.patchSession(t.sessionKey,{status:"running",taskSummary:t.taskSummary});break;case"run.completed":this.patchSession(t.sessionKey,{status:"idle",tokenAccumulator:this.mergeTokens(t.sessionKey,t.tokenCounts)});break;case"run.aborted":this.patchSession(t.sessionKey,{status:"error"});break;case"subagent.spawned":{const e=this.sessionMap.get(t.parentSessionKey);e&&this.patchSession(t.parentSessionKey,{childSessionKeys:[...new Set([...e.childSessionKeys??[],t.childSessionKey])]});break}}this.updateMetrics()}upsertSession(t){this.sessionMap.set(t.sessionKey,t),this.sessions=[...this.sessionMap.values()]}patchSession(t,e){const s=this.sessionMap.get(t);s&&(this.sessionMap.set(t,{...s,...e}),this.sessions=[...this.sessionMap.values()])}removeSession(t){this.sessionMap.delete(t),this.sessions=[...this.sessionMap.values()],this.selectedSessionKey===t&&(this.selectedSessionKey="")}mergeTokens(t,e){var o;const s=((o=this.sessionMap.get(t))==null?void 0:o.tokenAccumulator)??{inputTokens:0,outputTokens:0,totalTokens:0};return{inputTokens:s.inputTokens+e.inputTokens,outputTokens:s.outputTokens+e.outputTokens,totalTokens:s.totalTokens+e.totalTokens,estimatedCostUsd:(s.estimatedCostUsd??0)+(e.estimatedCostUsd??0)}}updateMetrics(){const t=this.sessions.filter(e=>e.status==="running").length;this.metrics={...this.metrics,activeSessions:t,lastUpdated:new Date().toISOString()}}get selectedSession(){return this.sessionMap.get(this.selectedSessionKey)??null}handleSessionSelected(t){this.selectedSessionKey=t.detail.sessionKey}handleFilterChange(t){this.filter=t.detail}render(){return h`
      <oc-resource-bar .metrics="${this.metrics}"></oc-resource-bar>
      <div class="main-layout">
        <aside class="left-pane" aria-label="Agent tree">
          <oc-agent-tree
            .sessions="${this.sessions}"
            .selectedKey="${this.selectedSessionKey}"
            @session-selected="${this.handleSessionSelected}"
          ></oc-agent-tree>
        </aside>

        <main class="center-pane" aria-label="Activity feed">
          <oc-activity-feed
            .filter="${this.filter}"
            @filter-change="${this.handleFilterChange}"
          ></oc-activity-feed>
        </main>

        <aside
          class="right-pane ${this.selectedSessionKey?"":"collapsed"}"
          aria-label="Session detail"
        >
          ${this.selectedSessionKey?h`
                <oc-session-detail
                  .session="${this.selectedSession}"
                  .toolCalls="${[]}"
                  @session-selected="${this.handleSessionSelected}"
                  @session-aborted="${()=>{this.selectedSessionKey=""}}"
                ></oc-session-detail>
              `:u}
        </aside>
      </div>
    `}};j.styles=H`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--oc-color-bg-primary, #fff);
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-pane {
      width: 260px;
      flex-shrink: 0;
      border-right: 1px solid var(--oc-color-border, #e5e7eb);
      overflow-y: auto;
    }

    .center-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .right-pane {
      width: 360px;
      flex-shrink: 0;
      border-left: 1px solid var(--oc-color-border, #e5e7eb);
      overflow-y: auto;
      transition: width var(--oc-transition-normal, 300ms ease),
                  opacity var(--oc-transition-normal, 300ms ease);
    }

    .right-pane.collapsed {
      width: 0;
      opacity: 0;
      overflow: hidden;
    }

    /* Responsive: single column on narrow screens */
    @media (max-width: 768px) {
      .main-layout { flex-direction: column; }
      .left-pane { width: 100%; height: 200px; border-right: none; border-bottom: 1px solid var(--oc-color-border, #e5e7eb); }
      .right-pane { width: 100%; border-left: none; border-top: 1px solid var(--oc-color-border, #e5e7eb); }
      .right-pane.collapsed { height: 0; width: 100%; }
    }
  `;te([b()],j.prototype,"sessions",2);te([b()],j.prototype,"selectedSessionKey",2);te([b()],j.prototype,"filter",2);te([b()],j.prototype,"metrics",2);j=te([F("oc-agents-view")],j);
//# sourceMappingURL=index-DOBu6uWq.js.map
