
/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe:     file format pei-i386


Disassembly of section .text:

0055bc54 <.text+0x15ac54>:
  55bc54:	55                   	push   ebp
  55bc55:	8b ec                	mov    ebp,esp
  55bc57:	83 c4 f4             	add    esp,0xfffffff4
  55bc5a:	9b d9 7d fe          	fstcw  WORD PTR [ebp-0x2]
  55bc5e:	9b                   	fwait
  55bc5f:	66 8b 45 fe          	mov    ax,WORD PTR [ebp-0x2]
  55bc63:	80 cc 0c             	or     ah,0xc
  55bc66:	66 89 45 fc          	mov    WORD PTR [ebp-0x4],ax
  55bc6a:	d9 6d fc             	fldcw  WORD PTR [ebp-0x4]
  55bc6d:	df 7d f4             	fistp  QWORD PTR [ebp-0xc]
  55bc70:	d9 6d fe             	fldcw  WORD PTR [ebp-0x2]
  55bc73:	8b 45 f4             	mov    eax,DWORD PTR [ebp-0xc]
  55bc76:	8b 55 f8             	mov    edx,DWORD PTR [ebp-0x8]
  55bc79:	c9                   	leave
  55bc7a:	c3                   	ret
