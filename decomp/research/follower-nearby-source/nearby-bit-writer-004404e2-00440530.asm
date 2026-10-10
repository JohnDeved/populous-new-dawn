
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004404e2 <.text+0x3f4e2>:
  4404e2:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  4404e9:	83 78 04 00          	cmp    DWORD PTR [eax+0x4],0x0
  4404ed:	8b 84 24 e4 03 00 00 	mov    eax,DWORD PTR [esp+0x3e4]
  4404f4:	74 0f                	je     0x440505
  4404f6:	81 88 3d 09 00 00 80 	or     DWORD PTR [eax+0x93d],0x80
  4404fd:	00 00 00 
  440500:	e9 8f 1d 00 00       	jmp    0x442294
  440505:	81 a0 3d 09 00 00 7f 	and    DWORD PTR [eax+0x93d],0xffffff7f
  44050c:	ff ff ff 
  44050f:	e9 80 1d 00 00       	jmp    0x442294
  440514:	33 f6                	xor    esi,esi
  440516:	8b 84 24 e8 03 00 00 	mov    eax,DWORD PTR [esp+0x3e8]
  44051d:	66 8b 40 04          	mov    ax,WORD PTR [eax+0x4]
  440521:	66 3b c6             	cmp    ax,si
  440524:	74 18                	je     0x44053e
  440526:	0f b7 c0             	movzx  eax,ax
  440529:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
