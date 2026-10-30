
decomp/research/native-tribe-controls/00437719-00437743.bin:     file format binary


Disassembly of section .data:

00437719 <.data>:
  437719:	33 c0                	xor    eax,eax
  43771b:	a0 9d 5e 89 00       	mov    al,ds:0x895e9d
  437720:	80 b8 a0 5e 89 00 10 	cmp    BYTE PTR [eax+0x895ea0],0x10
  437727:	75 09                	jne    0x437732
  437729:	83 0d 65 c6 89 00 10 	or     DWORD PTR ds:0x89c665,0x10
  437730:	eb 07                	jmp    0x437739
  437732:	83 25 65 c6 89 00 ef 	and    DWORD PTR ds:0x89c665,0xffffffef
  437739:	e8 b2 09 00 00       	call   0x4380f0
  43773e:	e8 6d 47 04 00       	call   0x47beb0
