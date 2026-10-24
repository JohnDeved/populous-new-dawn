
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a1f50 <.text+0xa0f50>:
  4a1f50:	83 ec 3c             	sub    esp,0x3c
  4a1f53:	53                   	push   ebx
  4a1f54:	56                   	push   esi
  4a1f55:	8b 74 24 48          	mov    esi,DWORD PTR [esp+0x48]
  4a1f59:	57                   	push   edi
  4a1f5a:	55                   	push   ebp
  4a1f5b:	8b 4e 08             	mov    ecx,DWORD PTR [esi+0x8]
  4a1f5e:	8b f9                	mov    edi,ecx
  4a1f60:	8b 5e 0c             	mov    ebx,DWORD PTR [esi+0xc]
  4a1f63:	33 ed                	xor    ebp,ebp
  4a1f65:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a1f69:	2b 3e                	sub    edi,DWORD PTR [esi]
  4a1f6b:	2b 5e 04             	sub    ebx,DWORD PTR [esi+0x4]
  4a1f6e:	66 8b 2a             	mov    bp,WORD PTR [edx]
  4a1f71:	33 c0                	xor    eax,eax
  4a1f73:	c1 e5 03             	shl    ebp,0x3
  4a1f76:	03 2d 14 df 59 00    	add    ebp,DWORD PTR ds:0x59df14
  4a1f7c:	66 8b 45 04          	mov    ax,WORD PTR [ebp+0x4]
  4a1f80:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  4a1f84:	33 c0                	xor    eax,eax
  4a1f86:	66 8b 45 06          	mov    ax,WORD PTR [ebp+0x6]
  4a1f8a:	33 ed                	xor    ebp,ebp
  4a1f8c:	66 8b 6a 0c          	mov    bp,WORD PTR [edx+0xc]
  4a1f90:	89 44 24 24          	mov    DWORD PTR [esp+0x24],eax
  4a1f94:	c1 e5 03             	shl    ebp,0x3
  4a1f97:	33 c0                	xor    eax,eax
  4a1f99:	03 2d 14 df 59 00    	add    ebp,DWORD PTR ds:0x59df14
  4a1f9f:	66 8b 45 04          	mov    ax,WORD PTR [ebp+0x4]
  4a1fa3:	89 44 24 40          	mov    DWORD PTR [esp+0x40],eax
  4a1fa7:	33 c0                	xor    eax,eax
  4a1fa9:	66 8b 45 06          	mov    ax,WORD PTR [ebp+0x6]
  4a1fad:	33 ed                	xor    ebp,ebp
  4a1faf:	66 8b 6a 02          	mov    bp,WORD PTR [edx+0x2]
  4a1fb3:	89 44 24 34          	mov    DWORD PTR [esp+0x34],eax
  4a1fb7:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  4a1fbc:	33 d2                	xor    edx,edx
  4a1fbe:	66 8b 54 e8 06       	mov    dx,WORD PTR [eax+ebp*8+0x6]
  4a1fc3:	33 ed                	xor    ebp,ebp
  4a1fc5:	8b 44 24 54          	mov    eax,DWORD PTR [esp+0x54]
  4a1fc9:	89 54 24 2c          	mov    DWORD PTR [esp+0x2c],edx
  4a1fcd:	66 8b 68 06          	mov    bp,WORD PTR [eax+0x6]
  4a1fd1:	8b 15 14 df 59 00    	mov    edx,DWORD PTR ds:0x59df14
  4a1fd7:	33 c0                	xor    eax,eax
  4a1fd9:	66 8b 44 ea 04       	mov    ax,WORD PTR [edx+ebp*8+0x4]
  4a1fde:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a1fe2:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  4a1fe6:	66 8b 42 0e          	mov    ax,WORD PTR [edx+0xe]
  4a1fea:	66 85 c0             	test   ax,ax
  4a1fed:	74 16                	je     0x4a2005
  4a1fef:	0f b7 c0             	movzx  eax,ax
  4a1ff2:	8b 2d 14 df 59 00    	mov    ebp,DWORD PTR ds:0x59df14
  4a1ff8:	33 d2                	xor    edx,edx
  4a1ffa:	66 8b 54 c5 06       	mov    dx,WORD PTR [ebp+eax*8+0x6]
  4a1fff:	89 54 24 30          	mov    DWORD PTR [esp+0x30],edx
  4a2003:	eb 08                	jmp    0x4a200d
  4a2005:	c7 44 24 30 00 00 00 	mov    DWORD PTR [esp+0x30],0x0
  4a200c:	00 
  4a200d:	39 7c 24 20          	cmp    DWORD PTR [esp+0x20],edi
  4a2011:	0f 8f 9e 04 00 00    	jg     0x4a24b5
  4a2017:	39 5c 24 24          	cmp    DWORD PTR [esp+0x24],ebx
  4a201b:	0f 8f 94 04 00 00    	jg     0x4a24b5
  4a2021:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a2025:	66 8b 52 08          	mov    dx,WORD PTR [edx+0x8]
  4a2029:	66 85 d2             	test   dx,dx
  4a202c:	0f 84 27 01 00 00    	je     0x4a2159
  4a2032:	8b 46 04             	mov    eax,DWORD PTR [esi+0x4]
  4a2035:	03 44 24 2c          	add    eax,DWORD PTR [esp+0x2c]
  4a2039:	8b 5e 0c             	mov    ebx,DWORD PTR [esi+0xc]
  4a203c:	89 44 24 14          	mov    DWORD PTR [esp+0x14],eax
  4a2040:	8b 06                	mov    eax,DWORD PTR [esi]
  4a2042:	03 44 24 28          	add    eax,DWORD PTR [esp+0x28]
  4a2046:	2b c8                	sub    ecx,eax
  4a2048:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a204c:	2b 4c 24 28          	sub    ecx,DWORD PTR [esp+0x28]
  4a2050:	2b 5c 24 14          	sub    ebx,DWORD PTR [esp+0x14]
  4a2054:	0f b7 c2             	movzx  eax,dx
  4a2057:	c1 e0 03             	shl    eax,0x3
  4a205a:	2b 5c 24 30          	sub    ebx,DWORD PTR [esp+0x30]
  4a205e:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  4a2064:	33 ff                	xor    edi,edi
  4a2066:	66 8b 78 04          	mov    di,WORD PTR [eax+0x4]
  4a206a:	33 ed                	xor    ebp,ebp
  4a206c:	66 8b 68 06          	mov    bp,WORD PTR [eax+0x6]
  4a2070:	66 85 d2             	test   dx,dx
  4a2073:	89 6c 24 3c          	mov    DWORD PTR [esp+0x3c],ebp
  4a2077:	0f 84 dc 00 00 00    	je     0x4a2159
  4a207d:	a1 bc e0 5c 00       	mov    eax,ds:0x5ce0bc
  4a2082:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  4a2086:	8d a8 3a 80 24 00    	lea    ebp,[eax+0x24803a]
  4a208c:	8b 44 24 10          	mov    eax,DWORD PTR [esp+0x10]
  4a2090:	89 44 24 44          	mov    DWORD PTR [esp+0x44],eax
  4a2094:	8b 44 24 14          	mov    eax,DWORD PTR [esp+0x14]
  4a2098:	c7 44 24 48 00 00 00 	mov    DWORD PTR [esp+0x48],0x0
  4a209f:	00 
  4a20a0:	df 6c 24 44          	fild   QWORD PTR [esp+0x44]
  4a20a4:	89 44 24 10          	mov    DWORD PTR [esp+0x10],eax
  4a20a8:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  4a20ac:	c7 44 24 14 00 00 00 	mov    DWORD PTR [esp+0x14],0x0
  4a20b3:	00 
  4a20b4:	d9 5d 00             	fstp   DWORD PTR [ebp+0x0]
  4a20b7:	df 6c 24 10          	fild   QWORD PTR [esp+0x10]
  4a20bb:	89 5c 24 10          	mov    DWORD PTR [esp+0x10],ebx
  4a20bf:	d9 90 3e 80 24 00    	fst    DWORD PTR [eax+0x24803e]
  4a20c5:	8b 6d 00             	mov    ebp,DWORD PTR [ebp+0x0]
  4a20c8:	6a 0c                	push   0xc
  4a20ca:	d9 1d 60 8f a6 00    	fstp   DWORD PTR ds:0xa68f60
  4a20d0:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  4a20d4:	89 2d 64 8f a6 00    	mov    DWORD PTR ds:0xa68f64,ebp
  4a20da:	89 4c 24 14          	mov    DWORD PTR [esp+0x14],ecx
  4a20de:	db 44 24 14          	fild   DWORD PTR [esp+0x14]
  4a20e2:	d9 c1                	fld    st(1)
  4a20e4:	da 74 24 40          	fidiv  DWORD PTR [esp+0x40]
  4a20e8:	8b 0d 74 a0 5d 00    	mov    ecx,DWORD PTR ds:0x5da074
  4a20ee:	89 7c 24 14          	mov    DWORD PTR [esp+0x14],edi
  4a20f2:	51                   	push   ecx
  4a20f3:	52                   	push   edx
  4a20f4:	68 e8 10 99 00       	push   0x9910e8
  4a20f9:	83 ec 04             	sub    esp,0x4
  4a20fc:	83 ec 04             	sub    esp,0x4
  4a20ff:	83 ec 04             	sub    esp,0x4
  4a2102:	83 ec 04             	sub    esp,0x4
  4a2105:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a2109:	d9 c0                	fld    st(0)
  4a210b:	da 74 24 30          	fidiv  DWORD PTR [esp+0x30]
  4a210f:	6a 00                	push   0x0
  4a2111:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a2117:	6a 00                	push   0x0
  4a2119:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  4a211d:	d9 c9                	fxch   st(1)
  4a211f:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a2123:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a2127:	e8 a4 be fd ff       	call   0x47dfd0
  4a212c:	8b 15 bc e0 5c 00    	mov    edx,DWORD PTR ds:0x5ce0bc
  4a2132:	8d 8a 3a 80 24 00    	lea    ecx,[edx+0x24803a]
  4a2138:	c7 01 00 00 00 00    	mov    DWORD PTR [ecx],0x0
  4a213e:	c7 82 3e 80 24 00 00 	mov    DWORD PTR [edx+0x24803e],0x0
  4a2145:	00 00 00 
  4a2148:	8b 01                	mov    eax,DWORD PTR [ecx]
  4a214a:	c7 05 60 8f a6 00 00 	mov    DWORD PTR ds:0xa68f60,0x0
  4a2151:	00 00 00 
  4a2154:	a3 64 8f a6 00       	mov    ds:0xa68f64,eax
  4a2159:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a215d:	66 8b 5a 02          	mov    bx,WORD PTR [edx+0x2]
  4a2161:	66 85 db             	test   bx,bx
  4a2164:	0f 84 9b 00 00 00    	je     0x4a2205
  4a216a:	8b 6e 08             	mov    ebp,DWORD PTR [esi+0x8]
  4a216d:	8b 3e                	mov    edi,DWORD PTR [esi]
  4a216f:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  4a2173:	8b c5                	mov    eax,ebp
  4a2175:	03 d7                	add    edx,edi
  4a2177:	2b 44 24 20          	sub    eax,DWORD PTR [esp+0x20]
  4a217b:	3b c2                	cmp    eax,edx
  4a217d:	0f 8e 82 00 00 00    	jle    0x4a2205
  4a2183:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4a2187:	6a 04                	push   0x4
  4a2189:	03 c9                	add    ecx,ecx
  4a218b:	a1 74 a0 5d 00       	mov    eax,ds:0x5da074
  4a2190:	2b e9                	sub    ebp,ecx
  4a2192:	50                   	push   eax
  4a2193:	2b ef                	sub    ebp,edi
  4a2195:	53                   	push   ebx
  4a2196:	89 6c 24 1c          	mov    DWORD PTR [esp+0x1c],ebp
  4a219a:	68 e8 10 99 00       	push   0x9910e8
  4a219f:	db 44 24 20          	fild   DWORD PTR [esp+0x20]
  4a21a3:	d9 c0                	fld    st(0)
  4a21a5:	da 74 24 3c          	fidiv  DWORD PTR [esp+0x3c]
  4a21a9:	68 00 00 80 3f       	push   0x3f800000
  4a21ae:	a1 14 df 59 00       	mov    eax,ds:0x59df14
  4a21b3:	83 ec 04             	sub    esp,0x4
  4a21b6:	33 c9                	xor    ecx,ecx
  4a21b8:	0f b7 db             	movzx  ebx,bx
  4a21bb:	66 8b 4c d8 06       	mov    cx,WORD PTR [eax+ebx*8+0x6]
  4a21c0:	83 ec 04             	sub    esp,0x4
  4a21c3:	83 ec 04             	sub    esp,0x4
  4a21c6:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a21ca:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4a21ce:	83 ec 04             	sub    esp,0x4
  4a21d1:	c7 44 24 38 00 00 00 	mov    DWORD PTR [esp+0x38],0x0
  4a21d8:	00 
  4a21d9:	df 6c 24 34          	fild   QWORD PTR [esp+0x34]
  4a21dd:	89 54 24 34          	mov    DWORD PTR [esp+0x34],edx
  4a21e1:	83 ec 04             	sub    esp,0x4
  4a21e4:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a21ea:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a21ee:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a21f2:	db 46 04             	fild   DWORD PTR [esi+0x4]
  4a21f5:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a21f9:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a21fd:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a2200:	e8 cb bd fd ff       	call   0x47dfd0
  4a2205:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a2209:	66 8b 5a 0e          	mov    bx,WORD PTR [edx+0xe]
  4a220d:	66 85 db             	test   bx,bx
  4a2210:	0f 84 a9 00 00 00    	je     0x4a22bf
  4a2216:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  4a2219:	8b 3e                	mov    edi,DWORD PTR [esi]
  4a221b:	8b 54 24 20          	mov    edx,DWORD PTR [esp+0x20]
  4a221f:	8b c8                	mov    ecx,eax
  4a2221:	03 d7                	add    edx,edi
  4a2223:	2b 4c 24 20          	sub    ecx,DWORD PTR [esp+0x20]
  4a2227:	3b ca                	cmp    ecx,edx
  4a2229:	0f 8e 90 00 00 00    	jle    0x4a22bf
  4a222f:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  4a2233:	6a 04                	push   0x4
  4a2235:	03 c9                	add    ecx,ecx
  4a2237:	2b c1                	sub    eax,ecx
  4a2239:	8b 0d 74 a0 5d 00    	mov    ecx,DWORD PTR ds:0x5da074
  4a223f:	2b c7                	sub    eax,edi
  4a2241:	51                   	push   ecx
  4a2242:	89 44 24 18          	mov    DWORD PTR [esp+0x18],eax
  4a2246:	53                   	push   ebx
  4a2247:	db 44 24 1c          	fild   DWORD PTR [esp+0x1c]
  4a224b:	0f b7 c3             	movzx  eax,bx
  4a224e:	d9 c0                	fld    st(0)
  4a2250:	da 74 24 38          	fidiv  DWORD PTR [esp+0x38]
  4a2254:	68 e8 10 99 00       	push   0x9910e8
  4a2259:	8b 1d 14 df 59 00    	mov    ebx,DWORD PTR ds:0x59df14
  4a225f:	68 00 00 80 3f       	push   0x3f800000
  4a2264:	33 c9                	xor    ecx,ecx
  4a2266:	66 8b 4c c3 06       	mov    cx,WORD PTR [ebx+eax*8+0x6]
  4a226b:	83 ec 04             	sub    esp,0x4
  4a226e:	83 ec 04             	sub    esp,0x4
  4a2271:	83 ec 04             	sub    esp,0x4
  4a2274:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4a2277:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a227b:	2b 44 24 50          	sub    eax,DWORD PTR [esp+0x50]
  4a227f:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4a2283:	c7 44 24 34 00 00 00 	mov    DWORD PTR [esp+0x34],0x0
  4a228a:	00 
  4a228b:	df 6c 24 30          	fild   QWORD PTR [esp+0x30]
  4a228f:	89 44 24 30          	mov    DWORD PTR [esp+0x30],eax
  4a2293:	83 ec 04             	sub    esp,0x4
  4a2296:	83 ec 04             	sub    esp,0x4
  4a2299:	d9 5c 24 0c          	fstp   DWORD PTR [esp+0xc]
  4a229d:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a22a1:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a22a5:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a22ab:	89 54 24 38          	mov    DWORD PTR [esp+0x38],edx
  4a22af:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a22b3:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a22b7:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a22ba:	e8 11 bd fd ff       	call   0x47dfd0
  4a22bf:	8b 7e 0c             	mov    edi,DWORD PTR [esi+0xc]
  4a22c2:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a22c6:	66 8b 4a 06          	mov    cx,WORD PTR [edx+0x6]
  4a22ca:	2b 7c 24 34          	sub    edi,DWORD PTR [esp+0x34]
  4a22ce:	66 85 c9             	test   cx,cx
  4a22d1:	0f 84 95 00 00 00    	je     0x4a236c
  4a22d7:	8b 5e 04             	mov    ebx,DWORD PTR [esi+0x4]
  4a22da:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  4a22de:	03 d3                	add    edx,ebx
  4a22e0:	3b d7                	cmp    edx,edi
  4a22e2:	0f 8d 84 00 00 00    	jge    0x4a236c
  4a22e8:	8b c7                	mov    eax,edi
  4a22ea:	6a 08                	push   0x8
  4a22ec:	2b c3                	sub    eax,ebx
  4a22ee:	8b 1d 74 a0 5d 00    	mov    ebx,DWORD PTR ds:0x5da074
  4a22f4:	2b 44 24 28          	sub    eax,DWORD PTR [esp+0x28]
  4a22f8:	53                   	push   ebx
  4a22f9:	8b 6c 24 30          	mov    ebp,DWORD PTR [esp+0x30]
  4a22fd:	51                   	push   ecx
  4a22fe:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  4a2302:	68 e8 10 99 00       	push   0x9910e8
  4a2307:	db 44 24 20          	fild   DWORD PTR [esp+0x20]
  4a230b:	83 ec 04             	sub    esp,0x4
  4a230e:	d9 c0                	fld    st(0)
  4a2310:	da 74 24 3c          	fidiv  DWORD PTR [esp+0x3c]
  4a2314:	0f b7 c1             	movzx  eax,cx
  4a2317:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a231a:	68 00 00 80 3f       	push   0x3f800000
  4a231f:	8b 1d 14 df 59 00    	mov    ebx,DWORD PTR ds:0x59df14
  4a2325:	83 ec 04             	sub    esp,0x4
  4a2328:	33 c9                	xor    ecx,ecx
  4a232a:	66 8b 4c c3 04       	mov    cx,WORD PTR [ebx+eax*8+0x4]
  4a232f:	83 ec 04             	sub    esp,0x4
  4a2332:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a2336:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4a233a:	83 ec 04             	sub    esp,0x4
  4a233d:	c7 44 24 38 00 00 00 	mov    DWORD PTR [esp+0x38],0x0
  4a2344:	00 
  4a2345:	df 6c 24 34          	fild   QWORD PTR [esp+0x34]
  4a2349:	89 54 24 34          	mov    DWORD PTR [esp+0x34],edx
  4a234d:	83 ec 04             	sub    esp,0x4
  4a2350:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a2356:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a235a:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a235e:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a2362:	db 06                	fild   DWORD PTR [esi]
  4a2364:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a2367:	e8 64 bc fd ff       	call   0x47dfd0
  4a236c:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a2370:	66 8b 4a 0a          	mov    cx,WORD PTR [edx+0xa]
  4a2374:	66 85 c9             	test   cx,cx
  4a2377:	0f 84 9b 00 00 00    	je     0x4a2418
  4a237d:	8b 5e 04             	mov    ebx,DWORD PTR [esi+0x4]
  4a2380:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  4a2384:	03 d3                	add    edx,ebx
  4a2386:	3b d7                	cmp    edx,edi
  4a2388:	0f 8d 8a 00 00 00    	jge    0x4a2418
  4a238e:	2b fb                	sub    edi,ebx
  4a2390:	6a 08                	push   0x8
  4a2392:	2b 7c 24 28          	sub    edi,DWORD PTR [esp+0x28]
  4a2396:	a1 74 a0 5d 00       	mov    eax,ds:0x5da074
  4a239b:	89 7c 24 14          	mov    DWORD PTR [esp+0x14],edi
  4a239f:	50                   	push   eax
  4a23a0:	db 44 24 18          	fild   DWORD PTR [esp+0x18]
  4a23a4:	51                   	push   ecx
  4a23a5:	68 e8 10 99 00       	push   0x9910e8
  4a23aa:	83 ec 04             	sub    esp,0x4
  4a23ad:	d9 c0                	fld    st(0)
  4a23af:	da 74 24 3c          	fidiv  DWORD PTR [esp+0x3c]
  4a23b3:	0f b7 e9             	movzx  ebp,cx
  4a23b6:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a23b9:	68 00 00 80 3f       	push   0x3f800000
  4a23be:	8b 3d 14 df 59 00    	mov    edi,DWORD PTR ds:0x59df14
  4a23c4:	83 ec 04             	sub    esp,0x4
  4a23c7:	33 c9                	xor    ecx,ecx
  4a23c9:	66 8b 4c ef 04       	mov    cx,WORD PTR [edi+ebp*8+0x4]
  4a23ce:	83 ec 04             	sub    esp,0x4
  4a23d1:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a23d5:	89 4c 24 30          	mov    DWORD PTR [esp+0x30],ecx
  4a23d9:	83 ec 04             	sub    esp,0x4
  4a23dc:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  4a23df:	c7 44 24 38 00 00 00 	mov    DWORD PTR [esp+0x38],0x0
  4a23e6:	00 
  4a23e7:	df 6c 24 34          	fild   QWORD PTR [esp+0x34]
  4a23eb:	2b 44 24 4c          	sub    eax,DWORD PTR [esp+0x4c]
  4a23ef:	89 54 24 34          	mov    DWORD PTR [esp+0x34],edx
  4a23f3:	83 ec 04             	sub    esp,0x4
  4a23f6:	8b 0d bc e0 5c 00    	mov    ecx,DWORD PTR ds:0x5ce0bc
  4a23fc:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  4a2400:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a2404:	89 44 24 38          	mov    DWORD PTR [esp+0x38],eax
  4a2408:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  4a240c:	db 44 24 38          	fild   DWORD PTR [esp+0x38]
  4a2410:	d9 1c 24             	fstp   DWORD PTR [esp]
  4a2413:	e8 b8 bb fd ff       	call   0x47dfd0
  4a2418:	33 c0                	xor    eax,eax
  4a241a:	8b 54 24 54          	mov    edx,DWORD PTR [esp+0x54]
  4a241e:	66 8b 02             	mov    ax,WORD PTR [edx]
  4a2421:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  4a2424:	c1 e0 03             	shl    eax,0x3
  4a2427:	8b 16                	mov    edx,DWORD PTR [esi]
  4a2429:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  4a242f:	50                   	push   eax
  4a2430:	51                   	push   ecx
  4a2431:	52                   	push   edx
  4a2432:	e8 a9 3e 07 00       	call   0x5162e0
  4a2437:	8b 54 24 60          	mov    edx,DWORD PTR [esp+0x60]
  4a243b:	83 c4 0c             	add    esp,0xc
  4a243e:	33 c0                	xor    eax,eax
  4a2440:	8b 4e 04             	mov    ecx,DWORD PTR [esi+0x4]
  4a2443:	66 8b 42 04          	mov    ax,WORD PTR [edx+0x4]
  4a2447:	c1 e0 03             	shl    eax,0x3
  4a244a:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  4a2450:	50                   	push   eax
  4a2451:	51                   	push   ecx
  4a2452:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  4a2455:	2b 44 24 28          	sub    eax,DWORD PTR [esp+0x28]
  4a2459:	50                   	push   eax
  4a245a:	e8 81 3e 07 00       	call   0x5162e0
  4a245f:	8b 54 24 60          	mov    edx,DWORD PTR [esp+0x60]
  4a2463:	83 c4 0c             	add    esp,0xc
  4a2466:	33 c0                	xor    eax,eax
  4a2468:	66 8b 42 0c          	mov    ax,WORD PTR [edx+0xc]
  4a246c:	8b 0e                	mov    ecx,DWORD PTR [esi]
  4a246e:	c1 e0 03             	shl    eax,0x3
  4a2471:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  4a2477:	50                   	push   eax
  4a2478:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4a247b:	2b 44 24 38          	sub    eax,DWORD PTR [esp+0x38]
  4a247f:	50                   	push   eax
  4a2480:	51                   	push   ecx
  4a2481:	e8 5a 3e 07 00       	call   0x5162e0
  4a2486:	8b 54 24 60          	mov    edx,DWORD PTR [esp+0x60]
  4a248a:	83 c4 0c             	add    esp,0xc
  4a248d:	33 c0                	xor    eax,eax
  4a248f:	66 8b 42 10          	mov    ax,WORD PTR [edx+0x10]
  4a2493:	c1 e0 03             	shl    eax,0x3
  4a2496:	03 05 14 df 59 00    	add    eax,DWORD PTR ds:0x59df14
  4a249c:	50                   	push   eax
  4a249d:	8b 46 0c             	mov    eax,DWORD PTR [esi+0xc]
  4a24a0:	2b 44 24 38          	sub    eax,DWORD PTR [esp+0x38]
  4a24a4:	50                   	push   eax
  4a24a5:	8b 46 08             	mov    eax,DWORD PTR [esi+0x8]
  4a24a8:	2b 44 24 48          	sub    eax,DWORD PTR [esp+0x48]
  4a24ac:	50                   	push   eax
  4a24ad:	e8 2e 3e 07 00       	call   0x5162e0
  4a24b2:	83 c4 0c             	add    esp,0xc
  4a24b5:	5d                   	pop    ebp
  4a24b6:	5f                   	pop    edi
  4a24b7:	5e                   	pop    esi
  4a24b8:	5b                   	pop    ebx
  4a24b9:	83 c4 3c             	add    esp,0x3c
  4a24bc:	c3                   	ret
  4a24bd:	cc                   	int3
  4a24be:	cc                   	int3
  4a24bf:	cc                   	int3
