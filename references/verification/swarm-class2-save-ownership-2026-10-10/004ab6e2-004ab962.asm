
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ab6e2 <.text+0xaa6e2>:
  4ab6e2:	33 c0                	xor    eax,eax
  4ab6e4:	a0 5a ce 89 00       	mov    al,ds:0x89ce5a
  4ab6e9:	48                   	dec    eax
  4ab6ea:	83 f8 03             	cmp    eax,0x3
  4ab6ed:	0f 87 93 01 00 00    	ja     0x4ab886
  4ab6f3:	ff 24 85 04 d8 4a 00 	jmp    DWORD PTR [eax*4+0x4ad804]
  4ab6fa:	e8 11 d1 f6 ff       	call   0x418810
  4ab6ff:	80 3d 5b ce 89 00 00 	cmp    BYTE PTR ds:0x89ce5b,0x0
  4ab706:	0f 85 7a 01 00 00    	jne    0x4ab886
  4ab70c:	80 3d 9d 56 89 00 00 	cmp    BYTE PTR ds:0x89569d,0x0
  4ab713:	74 49                	je     0x4ab75e
  4ab715:	80 3d bf ea 96 00 01 	cmp    BYTE PTR ds:0x96eabf,0x1
  4ab71c:	76 40                	jbe    0x4ab75e
  4ab71e:	33 c9                	xor    ecx,ecx
  4ab720:	b8 fe 4c 89 00       	mov    eax,0x894cfe
  4ab725:	83 0d 61 c6 89 00 40 	or     DWORD PTR ds:0x89c661,0x40
  4ab72c:	ba 04 00 00 00       	mov    edx,0x4
  4ab731:	f6 00 0f             	test   BYTE PTR [eax],0xf
  4ab734:	74 05                	je     0x4ab73b
  4ab736:	85 50 01             	test   DWORD PTR [eax+0x1],edx
  4ab739:	74 0d                	je     0x4ab748
  4ab73b:	83 c0 2a             	add    eax,0x2a
  4ab73e:	41                   	inc    ecx
  4ab73f:	3d a6 4d 89 00       	cmp    eax,0x894da6
  4ab744:	72 eb                	jb     0x4ab731
  4ab746:	eb 07                	jmp    0x4ab74f
  4ab748:	c6 81 a2 56 89 00 00 	mov    BYTE PTR [ecx+0x8956a2],0x0
  4ab74f:	c7 05 a6 56 89 00 00 	mov    DWORD PTR ds:0x8956a6,0x0
  4ab756:	00 00 00 
  4ab759:	e9 28 01 00 00       	jmp    0x4ab886
  4ab75e:	6a 01                	push   0x1
  4ab760:	e8 cb 9c f9 ff       	call   0x445430
  4ab765:	83 c4 04             	add    esp,0x4
  4ab768:	e9 19 01 00 00       	jmp    0x4ab886
  4ab76d:	33 c0                	xor    eax,eax
  4ab76f:	a0 5b ce 89 00       	mov    al,ds:0x89ce5b
  4ab774:	85 c0                	test   eax,eax
  4ab776:	74 0c                	je     0x4ab784
  4ab778:	83 f8 01             	cmp    eax,0x1
  4ab77b:	74 0e                	je     0x4ab78b
  4ab77d:	b8 09 00 00 00       	mov    eax,0x9
  4ab782:	eb 0c                	jmp    0x4ab790
  4ab784:	b8 09 00 00 00       	mov    eax,0x9
  4ab789:	eb 05                	jmp    0x4ab790
  4ab78b:	b8 0a 00 00 00       	mov    eax,0xa
  4ab790:	50                   	push   eax
  4ab791:	e8 9a bf f7 ff       	call   0x427730
  4ab796:	83 c4 04             	add    esp,0x4
  4ab799:	85 c0                	test   eax,eax
  4ab79b:	74 36                	je     0x4ab7d3
  4ab79d:	81 25 65 c6 89 00 ff 	and    DWORD PTR ds:0x89c665,0xfbffffff
  4ab7a4:	ff ff fb 
  4ab7a7:	83 f8 02             	cmp    eax,0x2
  4ab7aa:	75 04                	jne    0x4ab7b0
  4ab7ac:	6a 0a                	push   0xa
  4ab7ae:	eb 02                	jmp    0x4ab7b2
  4ab7b0:	6a 02                	push   0x2
  4ab7b2:	e8 a9 72 f9 ff       	call   0x442a60
  4ab7b7:	83 c4 04             	add    esp,0x4
  4ab7ba:	e8 31 dd f6 ff       	call   0x4194f0
  4ab7bf:	a1 34 2f 97 00       	mov    eax,ds:0x972f34
  4ab7c4:	8b 0d 3c 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f3c
  4ab7ca:	50                   	push   eax
  4ab7cb:	51                   	push   ecx
  4ab7cc:	68 f8 db 5c 00       	push   0x5cdbf8
  4ab7d1:	eb 12                	jmp    0x4ab7e5
  4ab7d3:	a1 38 2f 97 00       	mov    eax,ds:0x972f38
  4ab7d8:	8b 0d 3c 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f3c
  4ab7de:	50                   	push   eax
  4ab7df:	51                   	push   ecx
  4ab7e0:	68 e8 db 5c 00       	push   0x5cdbe8
  4ab7e5:	8d 54 24 38          	lea    edx,[esp+0x38]
  4ab7e9:	52                   	push   edx
  4ab7ea:	e8 d1 fd 0a 00       	call   0x55b5c0
  4ab7ef:	8d 44 24 3c          	lea    eax,[esp+0x3c]
  4ab7f3:	83 c4 10             	add    esp,0x10
  4ab7f6:	6a 00                	push   0x0
  4ab7f8:	6a ff                	push   0xffffffff
  4ab7fa:	6a 10                	push   0x10
  4ab7fc:	50                   	push   eax
  4ab7fd:	e8 1e f2 fc ff       	call   0x47aa20
  4ab802:	83 c4 10             	add    esp,0x10
  4ab805:	eb 7f                	jmp    0x4ab886
  4ab807:	33 c0                	xor    eax,eax
  4ab809:	a0 5b ce 89 00       	mov    al,ds:0x89ce5b
  4ab80e:	85 c0                	test   eax,eax
  4ab810:	74 0c                	je     0x4ab81e
  4ab812:	83 f8 01             	cmp    eax,0x1
  4ab815:	74 0e                	je     0x4ab825
  4ab817:	b8 09 00 00 00       	mov    eax,0x9
  4ab81c:	eb 0c                	jmp    0x4ab82a
  4ab81e:	b8 09 00 00 00       	mov    eax,0x9
  4ab823:	eb 05                	jmp    0x4ab82a
  4ab825:	b8 0a 00 00 00       	mov    eax,0xa
  4ab82a:	50                   	push   eax
  4ab82b:	e8 f0 b9 f7 ff       	call   0x427220
  4ab830:	83 c4 04             	add    esp,0x4
  4ab833:	85 c0                	test   eax,eax
  4ab835:	74 14                	je     0x4ab84b
  4ab837:	a1 34 2f 97 00       	mov    eax,ds:0x972f34
  4ab83c:	8b 0d 40 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f40
  4ab842:	50                   	push   eax
  4ab843:	51                   	push   ecx
  4ab844:	68 d8 db 5c 00       	push   0x5cdbd8
  4ab849:	eb 12                	jmp    0x4ab85d
  4ab84b:	a1 38 2f 97 00       	mov    eax,ds:0x972f38
  4ab850:	8b 0d 40 2f 97 00    	mov    ecx,DWORD PTR ds:0x972f40
  4ab856:	50                   	push   eax
  4ab857:	51                   	push   ecx
  4ab858:	68 c8 db 5c 00       	push   0x5cdbc8
  4ab85d:	8d 54 24 38          	lea    edx,[esp+0x38]
  4ab861:	52                   	push   edx
  4ab862:	e8 59 fd 0a 00       	call   0x55b5c0
  4ab867:	8d 44 24 3c          	lea    eax,[esp+0x3c]
  4ab86b:	83 c4 10             	add    esp,0x10
  4ab86e:	6a 00                	push   0x0
  4ab870:	6a ff                	push   0xffffffff
  4ab872:	6a 10                	push   0x10
  4ab874:	50                   	push   eax
  4ab875:	e8 a6 f1 fc ff       	call   0x47aa20
  4ab87a:	83 c4 10             	add    esp,0x10
  4ab87d:	eb 07                	jmp    0x4ab886
  4ab87f:	c6 05 14 cb 5f 00 01 	mov    BYTE PTR ds:0x5fcb14,0x1
  4ab886:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0x7fffffff
  4ab88d:	ff ff 7f 
  4ab890:	e9 4d 03 00 00       	jmp    0x4abbe2
  4ab895:	c6 05 14 cb 5f 00 02 	mov    BYTE PTR ds:0x5fcb14,0x2
  4ab89c:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0x7fffffff
  4ab8a3:	ff ff 7f 
  4ab8a6:	e9 37 03 00 00       	jmp    0x4abbe2
  4ab8ab:	6a 00                	push   0x0
  4ab8ad:	6a 00                	push   0x0
  4ab8af:	6a 0b                	push   0xb
  4ab8b1:	e8 4a e6 fc ff       	call   0x479f00
  4ab8b6:	83 c4 0c             	add    esp,0xc
  4ab8b9:	e9 24 03 00 00       	jmp    0x4abbe2
  4ab8be:	80 0d 08 e9 98 00 08 	or     BYTE PTR ds:0x98e908,0x8
  4ab8c5:	e9 18 03 00 00       	jmp    0x4abbe2
  4ab8ca:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xffdf
  4ab8d1:	df ff 
  4ab8d3:	66 81 25 08 e9 98 00 	and    WORD PTR ds:0x98e908,0xfff7
  4ab8da:	f7 ff 
  4ab8dc:	e9 01 03 00 00       	jmp    0x4abbe2
  4ab8e1:	80 0d 08 e9 98 00 20 	or     BYTE PTR ds:0x98e908,0x20
  4ab8e8:	e9 f5 02 00 00       	jmp    0x4abbe2
  4ab8ed:	66 a1 08 e9 98 00    	mov    ax,ds:0x98e908
  4ab8f3:	66 25 20 00          	and    ax,0x20
  4ab8f7:	66 3d 01 00          	cmp    ax,0x1
  4ab8fb:	1a c0                	sbb    al,al
  4ab8fd:	f6 d8                	neg    al
  4ab8ff:	50                   	push   eax
  4ab900:	53                   	push   ebx
  4ab901:	e8 ea e5 fc ff       	call   0x479ef0
  4ab906:	83 c4 08             	add    esp,0x8
  4ab909:	e9 d4 02 00 00       	jmp    0x4abbe2
  4ab90e:	6a 00                	push   0x0
  4ab910:	e8 8b c1 f6 ff       	call   0x417aa0
  4ab915:	83 c4 04             	add    esp,0x4
  4ab918:	e9 c5 02 00 00       	jmp    0x4abbe2
  4ab91d:	6a 02                	push   0x2
  4ab91f:	e8 4c 5a fa ff       	call   0x451370
  4ab924:	83 c4 04             	add    esp,0x4
  4ab927:	85 c0                	test   eax,eax
  4ab929:	0f 85 b3 02 00 00    	jne    0x4abbe2
  4ab92f:	66 83 3d 89 bb 89 00 	cmp    WORD PTR ds:0x89bb89,0x0
  4ab936:	00 
  4ab937:	0f 84 a5 02 00 00    	je     0x4abbe2
  4ab93d:	0f bf 05 89 bb 89 00 	movsx  eax,WORD PTR ds:0x89bb89
  4ab944:	50                   	push   eax
  4ab945:	8a 0d 82 bb 89 00    	mov    cl,BYTE PTR ds:0x89bb82
  4ab94b:	51                   	push   ecx
  4ab94c:	e8 ef 3a 00 00       	call   0x4af440
  4ab951:	83 c4 08             	add    esp,0x8
  4ab954:	e9 89 02 00 00       	jmp    0x4abbe2
  4ab959:	80 3d 81 bb 89 00 02 	cmp    BYTE PTR ds:0x89bb81,0x2
  4ab960:	74 0d                	je     0x4ab96f
