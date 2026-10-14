
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a5920 <.text+0xa4920>:
  4a5920:	d6                   	(bad)
  4a5921:	3b 05 2c d9 5c 00    	cmp    eax,DWORD PTR ds:0x5cd92c
  4a5927:	77 86                	ja     0x4a58af
  4a5929:	5d                   	pop    ebp
  4a592a:	5f                   	pop    edi
  4a592b:	5e                   	pop    esi
  4a592c:	5b                   	pop    ebx
  4a592d:	83 c4 58             	add    esp,0x58
  4a5930:	c3                   	ret
  4a5931:	ff d6                	call   esi
  4a5933:	3b 05 2c d9 5c 00    	cmp    eax,DWORD PTR ds:0x5cd92c
  4a5939:	0f 86 96 00 00 00    	jbe    0x4a59d5
  4a593f:	c6 05 63 d1 89 00 01 	mov    BYTE PTR ds:0x89d163,0x1
  4a5946:	e8 35 8b f9 ff       	call   0x43e480
  4a594b:	84 c0                	test   al,al
  4a594d:	74 6d                	je     0x4a59bc
  4a594f:	f6 05 6b c6 89 00 c0 	test   BYTE PTR ds:0x89c66b,0xc0
  4a5956:	74 05                	je     0x4a595d
  4a5958:	e8 d3 83 f9 ff       	call   0x43dd30
  4a595d:	e8 2e 8f f9 ff       	call   0x43e890
  4a5962:	e8 59 51 fd ff       	call   0x47aac0
  4a5967:	e8 b4 89 f9 ff       	call   0x43e320
  4a596c:	e8 bf 52 fd ff       	call   0x47ac30
  4a5971:	0f be 3d ac 5d 89 00 	movsx  edi,BYTE PTR ds:0x895dac
  4a5978:	47                   	inc    edi
  4a5979:	74 41                	je     0x4a59bc
  4a597b:	bb 02 00 00 00       	mov    ebx,0x2
  4a5980:	bd 00 00 80 00       	mov    ebp,0x800000
  4a5985:	38 1d 81 bb 89 00    	cmp    BYTE PTR ds:0x89bb81,bl
  4a598b:	74 27                	je     0x4a59b4
  4a598d:	80 3d 81 bb 89 00 03 	cmp    BYTE PTR ds:0x89bb81,0x3
  4a5994:	74 1e                	je     0x4a59b4
  4a5996:	e8 85 df 00 00       	call   0x4b3920
  4a599b:	85 2d 61 c6 89 00    	test   DWORD PTR ds:0x89c661,ebp
  4a59a1:	75 05                	jne    0x4a59a8
  4a59a3:	e8 68 bb fb ff       	call   0x461510
  4a59a8:	e8 93 03 00 00       	call   0x4a5d40
  4a59ad:	e8 3e 6d 04 00       	call   0x4ec6f0
  4a59b2:	eb 05                	jmp    0x4a59b9
  4a59b4:	e8 87 9c 00 00       	call   0x4af640
  4a59b9:	4f                   	dec    edi
  4a59ba:	75 c9                	jne    0x4a5985
  4a59bc:	a1                   	.byte 0xa1
  4a59bd:	30 d9                	xor    cl,bl
  4a59bf:	5c                   	pop    esp
