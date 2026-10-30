
d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004121c9 <.text+0x111c9>:
  4121c9:	f6 05 f4 c9 5f 00 01 	test   BYTE PTR ds:0x5fc9f4,0x1
  4121d0:	74 34                	je     0x412206
  4121d2:	33 c9                	xor    ecx,ecx
  4121d4:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  4121da:	7e 19                	jle    0x4121f5
  4121dc:	a1 bc 13 5f 00       	mov    eax,ds:0x5f13bc
  4121e1:	83 c0 28             	add    eax,0x28
  4121e4:	83 38 01             	cmp    DWORD PTR [eax],0x1
  4121e7:	74 3c                	je     0x412225
  4121e9:	83 c0 34             	add    eax,0x34
  4121ec:	41                   	inc    ecx
  4121ed:	39 0d b8 13 5f 00    	cmp    DWORD PTR ds:0x5f13b8,ecx
  4121f3:	7f ef                	jg     0x4121e4
  4121f5:	c7 05 ac 13 5f 00 00 	mov    DWORD PTR ds:0x5f13ac,0x0
  4121fc:	00 00 00
  4121ff:	83 25 f4 c9 5f 00 fe 	and    DWORD PTR ds:0x5fc9f4,0xfffffffe
  412206:	a1 ac 13 5f 00       	mov    eax,ds:0x5f13ac
  41220b:	5d                   	pop    ebp
  41220c:	5f                   	pop    edi
  41220d:	a3 b0 13 5f 00       	mov    ds:0x5f13b0,eax
  412212:	c7 05 b4 13 5f 00 1e 	mov    DWORD PTR ds:0x5f13b4,0x1e
  412219:	00 00 00
  41221c:	5e                   	pop    esi
  41221d:	5b                   	pop    ebx
  41221e:	81 c4 d4 02 00 00    	add    esp,0x2d4
  412224:	c3                   	ret
  412225:	89 0d ac 13 5f 00    	mov    DWORD PTR ds:0x5f13ac,ecx
  41222b:	eb d2                	jmp    0x4121ff
