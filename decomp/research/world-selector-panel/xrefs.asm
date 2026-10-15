  410e22:	a0 02 f0 88 00       	mov    al,ds:0x88f002
  410e27:	83 f8 01             	cmp    eax,0x1
  410e2a:	74 44                	je     0x410e70
  410e2c:	83 f8 04             	cmp    eax,0x4
  410e2f:	0f 84 08 01 00 00    	je     0x410f3d
  410e35:	83 f8 05             	cmp    eax,0x5
  410e38:	0f 84 f5 00 00 00    	je     0x410f33
  410e3e:	e8 9d 02 00 00       	call   0x4110e0
  410e43:	80 3d 02 f0 88 00 05 	cmp    BYTE PTR ds:0x88f002,0x5
  410e4a:	0f 84 3a 01 00 00    	je     0x410f8a
  410e50:	80 3d 02 f0 88 00 04 	cmp    BYTE PTR ds:0x88f002,0x4
  410e57:	0f 84 2d 01 00 00    	je     0x410f8a
  410e5d:	80 3d e0 de 59 00 00 	cmp    BYTE PTR ds:0x59dee0,0x0
  410e64:	75 05                	jne    0x410e6b
  410e66:	e8 15 ed 00 00       	call   0x41fb80
  410e6b:	e9 00 77 01 00       	jmp    0x428570
  410e70:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xff7fffff
  410e77:	ff 7f ff 
  410e7a:	6a 00                	push   0x0
  410e7c:	e8 3f 23 11 00       	call   0x5231c0
  410e81:	83 c4 04             	add    esp,0x4
  410e84:	66 81 3d cf c6 89 00 	cmp    WORD PTR ds:0x89c6cf,0x280
  410e8b:	80 02 
  410e8d:	75 1a                	jne    0x410ea9
--
  41fb40:	68 6c bd 59 00       	push   0x59bd6c
  41fb45:	68 23 cd 89 00       	push   0x89cd23
  41fb4a:	e8 61 06 0e 00       	call   0x5001b0
  41fb4f:	8d 44 24 08          	lea    eax,[esp+0x8]
  41fb53:	83 c4 08             	add    esp,0x8
  41fb56:	50                   	push   eax
  41fb57:	68 00 b0 04 00       	push   0x4b000
  41fb5c:	68 70 44 60 00       	push   0x604470
  41fb61:	68 23 cd 89 00       	push   0x89cd23
  41fb66:	e8 15 64 10 00       	call   0x525f80
  41fb6b:	83 c4 10             	add    esp,0x10
  41fb6e:	c7 05 e8 c9 5f 00 20 	mov    DWORD PTR ds:0x5fc9e8,0x20
  41fb75:	00 00 00 
  41fb78:	83 c4 04             	add    esp,0x4
  41fb7b:	c3                   	ret
  41fb7c:	cc                   	int3
  41fb7d:	cc                   	int3
--
  428fe0:	81 ff c8 a4 67 00    	cmp    edi,0x67a4c8
  428fe6:	72 92                	jb     0x428f7a
  428fe8:	c7 05 24 c3 59 00 38 	mov    DWORD PTR ds:0x59c324,0x65ca38
  428fef:	ca 65 00 
  428ff2:	68 c8 c3 59 00       	push   0x59c3c8
  428ff7:	e8 d4 e4 02 00       	call   0x4574d0
  428ffc:	83 c4 04             	add    esp,0x4
  428fff:	e8 4c 5d 05 00       	call   0x47ed50
  429004:	8b f0                	mov    esi,eax
  429006:	85 f6                	test   esi,esi
  429008:	7d 2e                	jge    0x429038
  42900a:	56                   	push   esi
  42900b:	68 44 c3 59 00       	push   0x59c344
  429010:	e8 bb e4 02 00       	call   0x4574d0
  429015:	83 c4 08             	add    esp,0x8
  429018:	8b c6                	mov    eax,esi
  42901a:	e9 33 ff ff ff       	jmp    0x428f52
