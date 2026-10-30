
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0047aa20 <.text+0x79a20>:
  47aa20:	8b 44 24 04          	mov    eax,DWORD PTR [esp+0x4]
  47aa24:	6a 50                	push   0x50
  47aa26:	80 0d ee 22 89 00 01 	or     BYTE PTR ds:0x8922ee,0x1
  47aa2d:	50                   	push   eax
  47aa2e:	68 f2 22 89 00       	push   0x8922f2
  47aa33:	e8 58 1b 0e 00       	call   0x55c590
  47aa38:	66 8b 44 24 14       	mov    ax,WORD PTR [esp+0x14]
  47aa3d:	83 c4 0c             	add    esp,0xc
  47aa40:	66 c7 05 90 23 89 00 	mov    WORD PTR ds:0x892390,0x0
  47aa47:	00 00 
  47aa49:	66 a3 ec 22 89 00    	mov    ds:0x8922ec,ax
  47aa4f:	8a 44 24 0c          	mov    al,BYTE PTR [esp+0xc]
  47aa53:	38 05 f0 c6 89 00    	cmp    BYTE PTR ds:0x89c6f0,al
  47aa59:	75 04                	jne    0x47aa5f
  47aa5b:	b0 ff                	mov    al,0xff
  47aa5d:	eb 0d                	jmp    0x47aa6c
  47aa5f:	3c ff                	cmp    al,0xff
  47aa61:	74 09                	je     0x47aa6c
  47aa63:	0f be c0             	movsx  eax,al
  47aa66:	8a 80 ab 56 89 00    	mov    al,BYTE PTR [eax+0x8956ab]
  47aa6c:	a2 94 23 89 00       	mov    ds:0x892394,al
  47aa71:	66 0f b6 44 24 10    	movzx  ax,BYTE PTR [esp+0x10]
  47aa77:	66 a3 f0 22 89 00    	mov    ds:0x8922f0,ax
  47aa7d:	c3                   	ret
  47aa7e:	cc                   	int3
  47aa7f:	cc                   	int3
  47aa80:	33 c0                	xor    eax,eax
  47aa82:	66 81 25 ee 22 89 00 	and    WORD PTR ds:0x8922ee,0xfffe
  47aa89:	fe ff 
  47aa8b:	66 a3 f2 22 89 00    	mov    ds:0x8922f2,ax
  47aa91:	66 a3 f0 22 89 00    	mov    ds:0x8922f0,ax
  47aa97:	66 a3 ec 22 89 00    	mov    ds:0x8922ec,ax
  47aa9d:	c3                   	ret
  47aa9e:	cc                   	int3
  47aa9f:	cc                   	int3
  47aaa0:	33 c0                	xor    eax,eax
  47aaa2:	66 81 25 ee 22 89 00 	and    WORD PTR ds:0x8922ee,0xfffd
  47aaa9:	fd ff 
  47aaab:	66 a3 97 23 89 00    	mov    ds:0x892397,ax
  47aab1:	66 a3 95 23 89 00    	mov    ds:0x892395,ax
  47aab7:	c3                   	ret
