
INPUT/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004587e3 <.text+0x577e3>:
  4587e3:	83 3d 38 d1 59 00 00 	cmp    DWORD PTR ds:0x59d138,0x0
  4587ea:	0f 84 49 02 00 00    	je     0x458a39
  4587f0:	c7 05 38 d1 59 00 00 	mov    DWORD PTR ds:0x59d138,0x0
  4587f7:	00 00 00 
  4587fa:	80 3d aa 56 89 00 00 	cmp    BYTE PTR ds:0x8956aa,0x0
  458801:	75 0a                	jne    0x45880d
  458803:	e8 28 b9 fb ff       	call   0x414130
  458808:	e8 83 b7 fb ff       	call   0x413f90
  45880d:	e8 5e 01 04 00       	call   0x498970
  458812:	c7 05 24 9d 74 00 00 	mov    DWORD PTR ds:0x749d24,0x0
  458819:	00 00 00 
  45881c:	a1 24 9d 74 00       	mov    eax,ds:0x749d24
  458821:	c1 e0 04             	shl    eax,0x4
  458824:	ff 05 24 9d 74 00    	inc    DWORD PTR ds:0x749d24
  45882a:	8b 88 f0 71 5d 00    	mov    ecx,DWORD PTR [eax+0x5d71f0]
  458830:	80 39 23             	cmp    BYTE PTR [ecx],0x23
  458833:	75 e7                	jne    0x45881c
  458835:	6a 01                	push   0x1
  458837:	ff 0d 24 9d 74 00    	dec    DWORD PTR ds:0x749d24
  45883d:	e8 fe 10 00 00       	call   0x459940
  458842:	c7 05 2c 9d 74 00 00 	mov    DWORD PTR ds:0x749d2c,0x0
  458849:	00 00 00 
  45884c:	83 c4 04             	add    esp,0x4
  45884f:	a1 2c 9d 74 00       	mov    eax,ds:0x749d2c
  458854:	ff 05 2c 9d 74 00    	inc    DWORD PTR ds:0x749d2c
  45885a:	8b 0c c5 c0 72 5d 00 	mov    ecx,DWORD PTR [eax*8+0x5d72c0]
  458861:	80 39 23             	cmp    BYTE PTR [ecx],0x23
  458864:	75 e9                	jne    0x45884f
  458866:	a1 6a bc 89 00       	mov    eax,ds:0x89bc6a
  45886b:	ff 0d 2c 9d 74 00    	dec    DWORD PTR ds:0x749d2c
  458871:	50                   	push   eax
  458872:	e8 f9 12 00 00       	call   0x459b70
  458877:	83 c4 04             	add    esp,0x4
  45887a:	e8 01 53 0a 00       	call   0x4fdb80
  45887f:	e8 bc 16 00 00       	call   0x459f40
