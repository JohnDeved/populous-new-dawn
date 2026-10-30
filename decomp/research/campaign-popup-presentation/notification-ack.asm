
populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00431bb0 <.text+0x30bb0>:
  431bb0:	0f be 44 24 04       	movsx  eax,BYTE PTR [esp+0x4]
  431bb5:	83 ec 08             	sub    esp,0x8
  431bb8:	8d 0c 80             	lea    ecx,[eax+eax*4]
  431bbb:	56                   	push   esi
  431bbc:	8b 84 c9 b3 3b 68 00 	mov    eax,DWORD PTR [ecx+ecx*8+0x683bb3]
  431bc3:	f6 c4 04             	test   ah,0x4
  431bc6:	8d b4 c9 92 3b 68 00 	lea    esi,[ecx+ecx*8+0x683b92]
  431bcd:	74 50                	je     0x431c1f
  431bcf:	a8 20                	test   al,0x20
  431bd1:	74 4c                	je     0x431c1f
  431bd3:	66 8b 46 18          	mov    ax,WORD PTR [esi+0x18]
  431bd7:	66 89 44 24 06       	mov    WORD PTR [esp+0x6],ax
  431bdc:	b8 fe 00 00 00       	mov    eax,0xfe
  431be1:	20 44 24 06          	and    BYTE PTR [esp+0x6],al
  431be5:	20 44 24 07          	and    BYTE PTR [esp+0x7],al
  431be9:	66 0f b6 44 24 06    	movzx  ax,BYTE PTR [esp+0x6]
  431bef:	66 40                	inc    ax
  431bf1:	6a 00                	push   0x0
  431bf3:	66 c1 e0 08          	shl    ax,0x8
  431bf7:	66 89 44 24 0c       	mov    WORD PTR [esp+0xc],ax
  431bfc:	8d 54 24 0c          	lea    edx,[esp+0xc]
  431c00:	66 0f b6 44 24 0b    	movzx  ax,BYTE PTR [esp+0xb]
  431c06:	66 40                	inc    ax
  431c08:	66 c1 e0 08          	shl    ax,0x8
  431c0c:	66 89 44 24 0e       	mov    WORD PTR [esp+0xe],ax
  431c11:	66 8b 4e 1a          	mov    cx,WORD PTR [esi+0x1a]
  431c15:	51                   	push   ecx
  431c16:	52                   	push   edx
  431c17:	e8 84 60 fe ff       	call   0x417ca0
  431c1c:	83 c4 0c             	add    esp,0xc
  431c1f:	8b 46 21             	mov    eax,DWORD PTR [esi+0x21]
  431c22:	a8 01                	test   al,0x1
  431c24:	74 11                	je     0x431c37
  431c26:	f6 c4 02             	test   ah,0x2
  431c29:	74 0c                	je     0x431c37
  431c2b:	83 c8 08             	or     eax,0x8
  431c2e:	89 46 21             	mov    DWORD PTR [esi+0x21],eax
  431c31:	83 c8 02             	or     eax,0x2
  431c34:	89 46 21             	mov    DWORD PTR [esi+0x21],eax
  431c37:	5e                   	pop    esi
  431c38:	83 c4 08             	add    esp,0x8
  431c3b:	c3                   	ret
