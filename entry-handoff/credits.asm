
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004c5af0 <.text+0xc4af0>:
  4c5af0:	80 3d 33 ce 89 00 00 	cmp    BYTE PTR ds:0x89ce33,0x0
  4c5af7:	74 1c                	je     0x4c5b15
  4c5af9:	6a 00                	push   0x0
  4c5afb:	a1 10 df 59 00       	mov    eax,ds:0x59df10
  4c5b00:	0f be 0d 33 ce 89 00 	movsx  ecx,BYTE PTR ds:0x89ce33
  4c5b07:	6a 00                	push   0x0
  4c5b09:	8d 14 c8             	lea    edx,[eax+ecx*8]
  4c5b0c:	52                   	push   edx
  4c5b0d:	e8 ee 6e 03 00       	call   0x4fca00
  4c5b12:	83 c4 0c             	add    esp,0xc
  4c5b15:	6a 0c                	push   0xc
  4c5b17:	e8 44 cf f7 ff       	call   0x442a60
  4c5b1c:	83 c4 04             	add    esp,0x4
  4c5b1f:	c3                   	ret
