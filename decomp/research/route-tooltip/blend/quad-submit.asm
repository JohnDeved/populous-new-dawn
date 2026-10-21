
/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0047d980 <.text+0x7c980>:
  47d980:	8d 81 2a f8 1f 00    	lea    eax,[ecx+0x1ff82a]
  47d986:	53                   	push   ebx
  47d987:	56                   	push   esi
  47d988:	8b d1                	mov    edx,ecx
  47d98a:	57                   	push   edi
  47d98b:	55                   	push   ebp
  47d98c:	8b 8a 2a 00 20 00    	mov    ecx,DWORD PTR [edx+0x20002a]
  47d992:	3b c1                	cmp    eax,ecx
  47d994:	0f 82 e3 00 00 00    	jb     0x47da7d
  47d99a:	33 c0                	xor    eax,eax
  47d99c:	85 c9                	test   ecx,ecx
  47d99e:	74 12                	je     0x47d9b2
  47d9a0:	89 41 1c             	mov    DWORD PTR [ecx+0x1c],eax
  47d9a3:	c7 01 00 f5 58 00    	mov    DWORD PTR [ecx],0x58f500
  47d9a9:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  47d9ac:	c7 01 18 f5 58 00    	mov    DWORD PTR [ecx],0x58f518
  47d9b2:	8b 9a 2a 00 20 00    	mov    ebx,DWORD PTR [edx+0x20002a]
  47d9b8:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  47d9bc:	b9 08 00 00 00       	mov    ecx,0x8
  47d9c1:	8d 7b 20             	lea    edi,[ebx+0x20]
  47d9c4:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  47d9c6:	8d 6b 40             	lea    ebp,[ebx+0x40]
  47d9c9:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  47d9cd:	8b fd                	mov    edi,ebp
  47d9cf:	b9 08 00 00 00       	mov    ecx,0x8
  47d9d4:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  47d9d6:	8d 43 60             	lea    eax,[ebx+0x60]
  47d9d9:	8b 74 24 1c          	mov    esi,DWORD PTR [esp+0x1c]
  47d9dd:	8b f8                	mov    edi,eax
  47d9df:	b9 08 00 00 00       	mov    ecx,0x8
  47d9e4:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  47d9e6:	8d bb 80 00 00 00    	lea    edi,[ebx+0x80]
  47d9ec:	8b 74 24 20          	mov    esi,DWORD PTR [esp+0x20]
  47d9f0:	b9 08 00 00 00       	mov    ecx,0x8
  47d9f5:	f3 a5                	rep movs DWORD PTR es:[edi],DWORD PTR ds:[esi]
  47d9f7:	d9 43 20             	fld    DWORD PTR [ebx+0x20]
  47d9fa:	d8 05 64 8f a6 00    	fadd   DWORD PTR ds:0xa68f64
  47da00:	d9 5b 20             	fstp   DWORD PTR [ebx+0x20]
  47da03:	d9 43 24             	fld    DWORD PTR [ebx+0x24]
  47da06:	d8 05 60 8f a6 00    	fadd   DWORD PTR ds:0xa68f60
  47da0c:	d9 5b 24             	fstp   DWORD PTR [ebx+0x24]
  47da0f:	d9 45 00             	fld    DWORD PTR [ebp+0x0]
  47da12:	d8 05 64 8f a6 00    	fadd   DWORD PTR ds:0xa68f64
  47da18:	d9 5d 00             	fstp   DWORD PTR [ebp+0x0]
  47da1b:	d9 43 44             	fld    DWORD PTR [ebx+0x44]
  47da1e:	d8 05 60 8f a6 00    	fadd   DWORD PTR ds:0xa68f60
  47da24:	d9 5b 44             	fstp   DWORD PTR [ebx+0x44]
  47da27:	d9 00                	fld    DWORD PTR [eax]
  47da29:	d8 05 64 8f a6 00    	fadd   DWORD PTR ds:0xa68f64
  47da2f:	d9 18                	fstp   DWORD PTR [eax]
  47da31:	d9 43 64             	fld    DWORD PTR [ebx+0x64]
  47da34:	d8 05 60 8f a6 00    	fadd   DWORD PTR ds:0xa68f60
  47da3a:	d9 5b 64             	fstp   DWORD PTR [ebx+0x64]
  47da3d:	d9 83 80 00 00 00    	fld    DWORD PTR [ebx+0x80]
  47da43:	d8 05 64 8f a6 00    	fadd   DWORD PTR ds:0xa68f64
  47da49:	8b 6c 24 24          	mov    ebp,DWORD PTR [esp+0x24]
  47da4d:	8b 44 24 28          	mov    eax,DWORD PTR [esp+0x28]
  47da51:	d9 9b 80 00 00 00    	fstp   DWORD PTR [ebx+0x80]
  47da57:	d9 83 84 00 00 00    	fld    DWORD PTR [ebx+0x84]
  47da5d:	d8 05 60 8f a6 00    	fadd   DWORD PTR ds:0xa68f60
  47da63:	d9 9b 84 00 00 00    	fstp   DWORD PTR [ebx+0x84]
  47da69:	89 6b 18             	mov    DWORD PTR [ebx+0x18],ebp
  47da6c:	89 43 0c             	mov    DWORD PTR [ebx+0xc],eax
  47da6f:	81 82 2a 00 20 00 a0 	add    DWORD PTR [edx+0x20002a],0xa0
  47da76:	00 00 00 
  47da79:	66 ff 42 1c          	inc    WORD PTR [edx+0x1c]
  47da7d:	5d                   	pop    ebp
  47da7e:	5f                   	pop    edi
  47da7f:	5e                   	pop    esi
  47da80:	5b                   	pop    ebx
  47da81:	c2 18 00             	ret    0x18
  47da84:	cc                   	int3
  47da85:	cc                   	int3
  47da86:	cc                   	int3
  47da87:	cc                   	int3
  47da88:	cc                   	int3
  47da89:	cc                   	int3
  47da8a:	cc                   	int3
  47da8b:	cc                   	int3
  47da8c:	cc                   	int3
  47da8d:	cc                   	int3
  47da8e:	cc                   	int3
  47da8f:	cc                   	int3
  47da90:	83 ec 08             	sub    esp,0x8
  47da93:	53                   	push   ebx
  47da94:	56                   	push   esi
  47da95:	db 81 52 80 24 00    	fild   DWORD PTR [ecx+0x248052]
  47da9b:	57                   	push   edi
  47da9c:	8b f1                	mov    esi,ecx
  47da9e:	8b 4c 24 18          	mov    ecx,DWORD PTR [esp+0x18]
  47daa2:	55                   	push   ebp
  47daa3:	d8 11                	fcom   DWORD PTR [ecx]
  47daa5:	d9 5c 24 14          	fstp   DWORD PTR [esp+0x14]
  47daa9:	df e0                	fnstsw ax
  47daab:	f6 c4 41             	test   ah,0x41
  47daae:	0f 85 91 01 00 00    	jne    0x47dc45
  47dab4:	db 86 56 80 24 00    	fild   DWORD PTR [esi+0x248056]
  47daba:	d8 59 04             	fcomp  DWORD PTR [ecx+0x4]
  47dabd:	df e0                	fnstsw ax
  47dabf:	f6 c4 41             	test   ah,0x41
  47dac2:	0f 85 7d 01 00 00    	jne    0x47dc45
  47dac8:	db 86 4a 80 24 00    	fild   DWORD PTR [esi+0x24804a]
  47dace:	8b 54 24 24          	mov    edx,DWORD PTR [esp+0x24]
  47dad2:	d8 1a                	fcomp  DWORD PTR [edx]
  47dad4:	df e0                	fnstsw ax
  47dad6:	f6 c4 41             	test   ah,0x41
  47dad9:	0f 84 66 01 00 00    	je     0x47dc45
  47dadf:	db 86 4e 80 24 00    	fild   DWORD PTR [esi+0x24804e]
  47dae5:	d8 5a 04             	fcomp  DWORD PTR [edx+0x4]
  47dae8:	df e0                	fnstsw ax
  47daea:	f6 c4 41             	test   ah,0x41
  47daed:	0f 84 52 01 00 00    	je     0x47dc45
  47daf3:	d9 02                	fld    DWORD PTR [edx]
  47daf5:	d8 5c 24 14          	fcomp  DWORD PTR [esp+0x14]
  47daf9:	df e0                	fnstsw ax
  47dafb:	f6 c4 41             	test   ah,0x41
  47dafe:	75 2d                	jne    0x47db2d
  47db00:	d9 44 24 14          	fld    DWORD PTR [esp+0x14]
  47db04:	d8 21                	fsub   DWORD PTR [ecx]
  47db06:	d9 02                	fld    DWORD PTR [edx]
  47db08:	d8 21                	fsub   DWORD PTR [ecx]
  47db0a:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  47db0e:	de f9                	fdivp  st(1),st
  47db10:	d9 42 18             	fld    DWORD PTR [edx+0x18]
  47db13:	d8 61 18             	fsub   DWORD PTR [ecx+0x18]
  47db16:	de c9                	fmulp  st(1),st
  47db18:	d8 41 18             	fadd   DWORD PTR [ecx+0x18]
  47db1b:	d9 57 18             	fst    DWORD PTR [edi+0x18]
  47db1e:	d9 5a 18             	fstp   DWORD PTR [edx+0x18]
  47db21:	db 86 52 80 24 00    	fild   DWORD PTR [esi+0x248052]
  47db27:	d9 17                	fst    DWORD PTR [edi]
  47db29:	d9 1a                	fstp   DWORD PTR [edx]
  47db2b:	eb 04                	jmp    0x47db31
  47db2d:	8b 7c 24 20          	mov    edi,DWORD PTR [esp+0x20]
  47db31:	db 86 4a 80 24 00    	fild   DWORD PTR [esi+0x24804a]
  47db37:	d8 11                	fcom   DWORD PTR [ecx]
  47db39:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  47db3d:	df e0                	fnstsw ax
  47db3f:	f6 c4 41             	test   ah,0x41
  47db42:	75 2d                	jne    0x47db71
  47db44:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  47db48:	d8 21                	fsub   DWORD PTR [ecx]
  47db4a:	d9 02                	fld    DWORD PTR [edx]
  47db4c:	d8 21                	fsub   DWORD PTR [ecx]
  47db4e:	8b 5c 24 28          	mov    ebx,DWORD PTR [esp+0x28]
  47db52:	de f9                	fdivp  st(1),st
  47db54:	d9 42 18             	fld    DWORD PTR [edx+0x18]
  47db57:	d8 61 18             	fsub   DWORD PTR [ecx+0x18]
  47db5a:	de c9                	fmulp  st(1),st
  47db5c:	d8 41 18             	fadd   DWORD PTR [ecx+0x18]
  47db5f:	d9 53 18             	fst    DWORD PTR [ebx+0x18]
  47db62:	d9 59 18             	fstp   DWORD PTR [ecx+0x18]
  47db65:	db 86 4a 80 24 00    	fild   DWORD PTR [esi+0x24804a]
  47db6b:	d9 13                	fst    DWORD PTR [ebx]
  47db6d:	d9 19                	fstp   DWORD PTR [ecx]
  47db6f:	eb 04                	jmp    0x47db75
  47db71:	8b 5c 24 28          	mov    ebx,DWORD PTR [esp+0x28]
  47db75:	db 86 56 80 24 00    	fild   DWORD PTR [esi+0x248056]
  47db7b:	d8 52 04             	fcom   DWORD PTR [edx+0x4]
  47db7e:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  47db82:	df e0                	fnstsw ax
  47db84:	f6 c4 01             	test   ah,0x1
  47db87:	74 2c                	je     0x47dbb5
  47db89:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  47db8d:	d8 61 04             	fsub   DWORD PTR [ecx+0x4]
  47db90:	d9 42 04             	fld    DWORD PTR [edx+0x4]
  47db93:	d8 61 04             	fsub   DWORD PTR [ecx+0x4]
  47db96:	de f9                	fdivp  st(1),st
  47db98:	d9 42 1c             	fld    DWORD PTR [edx+0x1c]
  47db9b:	d8 61 1c             	fsub   DWORD PTR [ecx+0x1c]
  47db9e:	de c9                	fmulp  st(1),st
  47dba0:	d8 41 1c             	fadd   DWORD PTR [ecx+0x1c]
  47dba3:	d9 53 1c             	fst    DWORD PTR [ebx+0x1c]
  47dba6:	d9 5a 1c             	fstp   DWORD PTR [edx+0x1c]
  47dba9:	db 86 56 80 24 00    	fild   DWORD PTR [esi+0x248056]
  47dbaf:	d9 53 04             	fst    DWORD PTR [ebx+0x4]
  47dbb2:	d9 5a 04             	fstp   DWORD PTR [edx+0x4]
  47dbb5:	db 86 4e 80 24 00    	fild   DWORD PTR [esi+0x24804e]
  47dbbb:	d8 51 04             	fcom   DWORD PTR [ecx+0x4]
  47dbbe:	d9 5c 24 10          	fstp   DWORD PTR [esp+0x10]
  47dbc2:	df e0                	fnstsw ax
  47dbc4:	f6 c4 41             	test   ah,0x41
  47dbc7:	75 2c                	jne    0x47dbf5
  47dbc9:	d9 44 24 10          	fld    DWORD PTR [esp+0x10]
  47dbcd:	d8 61 04             	fsub   DWORD PTR [ecx+0x4]
  47dbd0:	d9 42 04             	fld    DWORD PTR [edx+0x4]
  47dbd3:	d8 61 04             	fsub   DWORD PTR [ecx+0x4]
  47dbd6:	de f9                	fdivp  st(1),st
  47dbd8:	d9 42 1c             	fld    DWORD PTR [edx+0x1c]
  47dbdb:	d8 61 1c             	fsub   DWORD PTR [ecx+0x1c]
  47dbde:	de c9                	fmulp  st(1),st
  47dbe0:	d8 41 1c             	fadd   DWORD PTR [ecx+0x1c]
  47dbe3:	d9 57 1c             	fst    DWORD PTR [edi+0x1c]
  47dbe6:	d9 59 1c             	fstp   DWORD PTR [ecx+0x1c]
  47dbe9:	db 86 4e 80 24 00    	fild   DWORD PTR [esi+0x24804e]
  47dbef:	d9 57 04             	fst    DWORD PTR [edi+0x4]
  47dbf2:	d9 59 04             	fstp   DWORD PTR [ecx+0x4]
  47dbf5:	8b 86 2a 00 20 00    	mov    eax,DWORD PTR [esi+0x20002a]
  47dbfb:	8d ae 2a f8 1f 00    	lea    ebp,[esi+0x1ff82a]
  47dc01:	3b e8                	cmp    ebp,eax
  47dc03:	72 40                	jb     0x47dc45
  47dc05:	33 ed                	xor    ebp,ebp
  47dc07:	85 c0                	test   eax,eax
  47dc09:	74 12                	je     0x47dc1d
  47dc0b:	89 68 1c             	mov    DWORD PTR [eax+0x1c],ebp
  47dc0e:	c7 00 00 f5 58 00    	mov    DWORD PTR [eax],0x58f500
  47dc14:	89 68 04             	mov    DWORD PTR [eax+0x4],ebp
  47dc17:	c7 00 20 f5 58 00    	mov    DWORD PTR [eax],0x58f520
  47dc1d:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  47dc21:	8b 6c 24 30          	mov    ebp,DWORD PTR [esp+0x30]
  47dc25:	50                   	push   eax
  47dc26:	55                   	push   ebp
  47dc27:	8b 44 24 34          	mov    eax,DWORD PTR [esp+0x34]
  47dc2b:	50                   	push   eax
  47dc2c:	53                   	push   ebx
  47dc2d:	52                   	push   edx
  47dc2e:	57                   	push   edi
  47dc2f:	51                   	push   ecx
  47dc30:	8b 8e 2a 00 20 00    	mov    ecx,DWORD PTR [esi+0x20002a]
  47dc36:	e8 d5 c5 07 00       	call   0x4fa210
  47dc3b:	66 ff 46 1c          	inc    WORD PTR [esi+0x1c]
  47dc3f:	01 86 2a 00 20 00    	add    DWORD PTR [esi+0x20002a],eax
  47dc45:	5d                   	pop    ebp
  47dc46:	5f                   	pop    edi
  47dc47:	5e                   	pop    esi
  47dc48:	5b                   	pop    ebx
  47dc49:	83 c4 08             	add    esp,0x8
  47dc4c:	c2 1c 00             	ret    0x1c
  47dc4f:	cc                   	int3
  47dc50:	83 ec 08             	sub    esp,0x8
  47dc53:	53                   	push   ebx
  47dc54:	56                   	push   esi
  47dc55:	db 81 52 80 24 00    	fild   DWORD PTR [ecx+0x248052]
  47dc5b:	57                   	push   edi
  47dc5c:	8b f1                	mov    esi,ecx
  47dc5e:	d8 5c 24 18          	fcomp  DWORD PTR [esp+0x18]
  47dc62:	df e0                	fnstsw ax
  47dc64:	f6 c4 41             	test   ah,0x41
  47dc67:	0f 85 27 01 00 00    	jne    0x47dd94
  47dc6d:	db 86 56 80 24 00    	fild   DWORD PTR [esi+0x248056]
  47dc73:	d8 5c 24 1c          	fcomp  DWORD PTR [esp+0x1c]
  47dc77:	df e0                	fnstsw ax
  47dc79:	f6 c4 41             	test   ah,0x41
  47dc7c:	0f 85 12 01 00 00    	jne    0x47dd94
  47dc82:	66 8b 54 24 24       	mov    dx,WORD PTR [esp+0x24]
  47dc87:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  47dc8b:	0f b7 c2             	movzx  eax,dx
  47dc8e:	c1 e0 02             	shl    eax,0x2
  47dc91:	8b 59 04             	mov    ebx,DWORD PTR [ecx+0x4]
  47dc94:	8d 3c c0             	lea    edi,[eax+eax*8]
  47dc97:	33 c0                	xor    eax,eax
  47dc99:	03 df                	add    ebx,edi
  47dc9b:	66 8b 03             	mov    ax,WORD PTR [ebx]
  47dc9e:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47dca2:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47dca6:	d8 44 24 18          	fadd   DWORD PTR [esp+0x18]
  47dcaa:	db 86 4a 80 24 00    	fild   DWORD PTR [esi+0x24804a]
  47dcb0:	de d9                	fcompp
  47dcb2:	df e0                	fnstsw ax
  47dcb4:	f6 c4 41             	test   ah,0x41
  47dcb7:	0f 84 d7 00 00 00    	je     0x47dd94
  47dcbd:	33 c0                	xor    eax,eax
  47dcbf:	66 8b 43 02          	mov    ax,WORD PTR [ebx+0x2]
  47dcc3:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47dcc7:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47dccb:	d8 44 24 1c          	fadd   DWORD PTR [esp+0x1c]
  47dccf:	db 86 4e 80 24 00    	fild   DWORD PTR [esi+0x24804e]
  47dcd5:	de d9                	fcompp
  47dcd7:	df e0                	fnstsw ax
  47dcd9:	f6 c4 41             	test   ah,0x41
  47dcdc:	0f 84 b2 00 00 00    	je     0x47dd94
  47dce2:	8b 9e 2a 00 20 00    	mov    ebx,DWORD PTR [esi+0x20002a]
  47dce8:	8d 86 2a f8 1f 00    	lea    eax,[esi+0x1ff82a]
  47dcee:	3b c3                	cmp    eax,ebx
  47dcf0:	0f 82 9e 00 00 00    	jb     0x47dd94
  47dcf6:	33 c0                	xor    eax,eax
  47dcf8:	85 db                	test   ebx,ebx
  47dcfa:	74 18                	je     0x47dd14
  47dcfc:	89 43 1c             	mov    DWORD PTR [ebx+0x1c],eax
  47dcff:	c7 03 00 f5 58 00    	mov    DWORD PTR [ebx],0x58f500
  47dd05:	89 43 04             	mov    DWORD PTR [ebx+0x4],eax
  47dd08:	c7 03 28 f5 58 00    	mov    DWORD PTR [ebx],0x58f528
  47dd0e:	89 43 20             	mov    DWORD PTR [ebx+0x20],eax
  47dd11:	89 43 56             	mov    DWORD PTR [ebx+0x56],eax
  47dd14:	03 79 04             	add    edi,DWORD PTR [ecx+0x4]
  47dd17:	68 00 00 80 bf       	push   0xbf800000
  47dd1c:	8b 5c 24 30          	mov    ebx,DWORD PTR [esp+0x30]
  47dd20:	68 00 00 80 bf       	push   0xbf800000
  47dd25:	53                   	push   ebx
  47dd26:	33 c0                	xor    eax,eax
  47dd28:	66 8b 47 02          	mov    ax,WORD PTR [edi+0x2]
  47dd2c:	52                   	push   edx
  47dd2d:	89 44 24 1c          	mov    DWORD PTR [esp+0x1c],eax
  47dd31:	51                   	push   ecx
  47dd32:	33 c0                	xor    eax,eax
  47dd34:	83 ec 04             	sub    esp,0x4
  47dd37:	33 c9                	xor    ecx,ecx
  47dd39:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  47dd3d:	df 6c 24 24          	fild   QWORD PTR [esp+0x24]
  47dd41:	66 8b 0f             	mov    cx,WORD PTR [edi]
  47dd44:	83 ec 04             	sub    esp,0x4
  47dd47:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  47dd4b:	8b 54 24 34          	mov    edx,DWORD PTR [esp+0x34]
  47dd4f:	89 4c 24 28          	mov    DWORD PTR [esp+0x28],ecx
  47dd53:	8b 8e 2a 00 20 00    	mov    ecx,DWORD PTR [esi+0x20002a]
  47dd59:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  47dd5d:	df 6c 24 28          	fild   QWORD PTR [esp+0x28]
  47dd61:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  47dd65:	50                   	push   eax
  47dd66:	52                   	push   edx
  47dd67:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  47dd6b:	e8 30 b8 07 00       	call   0x4f95a0
  47dd70:	8b 8e 2a 00 20 00    	mov    ecx,DWORD PTR [esi+0x20002a]
  47dd76:	8b 7c 24 28          	mov    edi,DWORD PTR [esp+0x28]
  47dd7a:	8b 51 4e             	mov    edx,DWORD PTR [ecx+0x4e]
  47dd7d:	33 fa                	xor    edi,edx
  47dd7f:	81 e7 ff ff ff 00    	and    edi,0xffffff
  47dd85:	33 fa                	xor    edi,edx
  47dd87:	89 79 4e             	mov    DWORD PTR [ecx+0x4e],edi
  47dd8a:	66 ff 46 1c          	inc    WORD PTR [esi+0x1c]
  47dd8e:	01 86 2a 00 20 00    	add    DWORD PTR [esi+0x20002a],eax
  47dd94:	5f                   	pop    edi
  47dd95:	5e                   	pop    esi
  47dd96:	5b                   	pop    ebx
  47dd97:	83 c4 08             	add    esp,0x8
  47dd9a:	c2 18 00             	ret    0x18
  47dd9d:	cc                   	int3
  47dd9e:	cc                   	int3
  47dd9f:	cc                   	int3
  47dda0:	83 ec 08             	sub    esp,0x8
  47dda3:	53                   	push   ebx
  47dda4:	56                   	push   esi
  47dda5:	db 81 52 80 24 00    	fild   DWORD PTR [ecx+0x248052]
  47ddab:	57                   	push   edi
  47ddac:	8b f1                	mov    esi,ecx
  47ddae:	d8 5c 24 18          	fcomp  DWORD PTR [esp+0x18]
  47ddb2:	df e0                	fnstsw ax
  47ddb4:	f6 c4 41             	test   ah,0x41
  47ddb7:	0f 85 27 01 00 00    	jne    0x47dee4
  47ddbd:	db 86 56 80 24 00    	fild   DWORD PTR [esi+0x248056]
  47ddc3:	d8 5c 24 1c          	fcomp  DWORD PTR [esp+0x1c]
  47ddc7:	df e0                	fnstsw ax
  47ddc9:	f6 c4 41             	test   ah,0x41
  47ddcc:	0f 85 12 01 00 00    	jne    0x47dee4
  47ddd2:	66 8b 54 24 24       	mov    dx,WORD PTR [esp+0x24]
  47ddd7:	8b 4c 24 20          	mov    ecx,DWORD PTR [esp+0x20]
  47dddb:	0f b7 c2             	movzx  eax,dx
  47ddde:	c1 e0 02             	shl    eax,0x2
  47dde1:	8b 79 04             	mov    edi,DWORD PTR [ecx+0x4]
  47dde4:	8d 1c c0             	lea    ebx,[eax+eax*8]
  47dde7:	33 c0                	xor    eax,eax
  47dde9:	03 fb                	add    edi,ebx
  47ddeb:	66 8b 07             	mov    ax,WORD PTR [edi]
  47ddee:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47ddf2:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47ddf6:	d8 44 24 18          	fadd   DWORD PTR [esp+0x18]
  47ddfa:	db 86 4a 80 24 00    	fild   DWORD PTR [esi+0x24804a]
  47de00:	de d9                	fcompp
  47de02:	df e0                	fnstsw ax
  47de04:	f6 c4 41             	test   ah,0x41
  47de07:	0f 84 d7 00 00 00    	je     0x47dee4
  47de0d:	33 c0                	xor    eax,eax
  47de0f:	66 8b 47 02          	mov    ax,WORD PTR [edi+0x2]
  47de13:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47de17:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47de1b:	d8 44 24 1c          	fadd   DWORD PTR [esp+0x1c]
  47de1f:	db 86 4e 80 24 00    	fild   DWORD PTR [esi+0x24804e]
  47de25:	de d9                	fcompp
  47de27:	df e0                	fnstsw ax
  47de29:	f6 c4 41             	test   ah,0x41
  47de2c:	0f 84 b2 00 00 00    	je     0x47dee4
  47de32:	8b be 2a 00 20 00    	mov    edi,DWORD PTR [esi+0x20002a]
  47de38:	8d 86 2a f8 1f 00    	lea    eax,[esi+0x1ff82a]
  47de3e:	3b c7                	cmp    eax,edi
  47de40:	0f 82 9e 00 00 00    	jb     0x47dee4
  47de46:	33 c0                	xor    eax,eax
  47de48:	85 ff                	test   edi,edi
  47de4a:	74 18                	je     0x47de64
  47de4c:	89 47 1c             	mov    DWORD PTR [edi+0x1c],eax
  47de4f:	c7 07 00 f5 58 00    	mov    DWORD PTR [edi],0x58f500
  47de55:	89 47 04             	mov    DWORD PTR [edi+0x4],eax
  47de58:	c7 07 28 f5 58 00    	mov    DWORD PTR [edi],0x58f528
  47de5e:	89 47 20             	mov    DWORD PTR [edi+0x20],eax
  47de61:	89 47 56             	mov    DWORD PTR [edi+0x56],eax
  47de64:	8b be 2a 00 20 00    	mov    edi,DWORD PTR [esi+0x20002a]
  47de6a:	68 00 00 80 bf       	push   0xbf800000
  47de6f:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  47de73:	68 00 00 80 bf       	push   0xbf800000
  47de78:	83 4f 20 10          	or     DWORD PTR [edi+0x20],0x10
  47de7c:	03 59 04             	add    ebx,DWORD PTR [ecx+0x4]
  47de7f:	50                   	push   eax
  47de80:	52                   	push   edx
  47de81:	33 c0                	xor    eax,eax
  47de83:	66 8b 43 02          	mov    ax,WORD PTR [ebx+0x2]
  47de87:	51                   	push   ecx
  47de88:	89 44 24 20          	mov    DWORD PTR [esp+0x20],eax
  47de8c:	83 ec 04             	sub    esp,0x4
  47de8f:	33 c0                	xor    eax,eax
  47de91:	33 c9                	xor    ecx,ecx
  47de93:	66 8b 0b             	mov    cx,WORD PTR [ebx]
  47de96:	89 44 24 28          	mov    DWORD PTR [esp+0x28],eax
  47de9a:	df 6c 24 24          	fild   QWORD PTR [esp+0x24]
  47de9e:	89 4c 24 24          	mov    DWORD PTR [esp+0x24],ecx
  47dea2:	83 ec 04             	sub    esp,0x4
  47dea5:	8b 54 24 34          	mov    edx,DWORD PTR [esp+0x34]
  47dea9:	89 44 24 2c          	mov    DWORD PTR [esp+0x2c],eax
  47dead:	8b 44 24 38          	mov    eax,DWORD PTR [esp+0x38]
  47deb1:	8b cf                	mov    ecx,edi
  47deb3:	d9 5c 24 04          	fstp   DWORD PTR [esp+0x4]
  47deb7:	df 6c 24 28          	fild   QWORD PTR [esp+0x28]
  47debb:	50                   	push   eax
  47debc:	52                   	push   edx
  47debd:	d9 5c 24 08          	fstp   DWORD PTR [esp+0x8]
  47dec1:	e8 da b6 07 00       	call   0x4f95a0
  47dec6:	8b 4f 4e             	mov    ecx,DWORD PTR [edi+0x4e]
  47dec9:	8b d9                	mov    ebx,ecx
  47decb:	33 5c 24 28          	xor    ebx,DWORD PTR [esp+0x28]
  47decf:	81 e3 ff ff ff 00    	and    ebx,0xffffff
  47ded5:	33 d9                	xor    ebx,ecx
  47ded7:	89 5f 4e             	mov    DWORD PTR [edi+0x4e],ebx
  47deda:	66 ff 46 1c          	inc    WORD PTR [esi+0x1c]
  47dede:	01 86 2a 00 20 00    	add    DWORD PTR [esi+0x20002a],eax
  47dee4:	5f                   	pop    edi
  47dee5:	5e                   	pop    esi
  47dee6:	5b                   	pop    ebx
  47dee7:	83 c4 08             	add    esp,0x8
  47deea:	c2 18 00             	ret    0x18
  47deed:	cc                   	int3
  47deee:	cc                   	int3
  47deef:	cc                   	int3
  47def0:	83 ec 04             	sub    esp,0x4
  47def3:	53                   	push   ebx
  47def4:	56                   	push   esi
  47def5:	8d 81 2a f8 1f 00    	lea    eax,[ecx+0x1ff82a]
  47defb:	57                   	push   edi
  47defc:	8b f1                	mov    esi,ecx
  47defe:	8b 89 2a 00 20 00    	mov    ecx,DWORD PTR [ecx+0x20002a]
  47df04:	3b c1                	cmp    eax,ecx
  47df06:	0f 82 b8 00 00 00    	jb     0x47dfc4
  47df0c:	33 c0                	xor    eax,eax
  47df0e:	85 c9                	test   ecx,ecx
  47df10:	74 18                	je     0x47df2a
  47df12:	89 41 1c             	mov    DWORD PTR [ecx+0x1c],eax
  47df15:	c7 01 00 f5 58 00    	mov    DWORD PTR [ecx],0x58f500
  47df1b:	89 41 04             	mov    DWORD PTR [ecx+0x4],eax
  47df1e:	c7 01 28 f5 58 00    	mov    DWORD PTR [ecx],0x58f528
  47df24:	89 41 20             	mov    DWORD PTR [ecx+0x20],eax
  47df27:	89 41 56             	mov    DWORD PTR [ecx+0x56],eax
  47df2a:	66 8b 54 24 28       	mov    dx,WORD PTR [esp+0x28]
  47df2f:	8b be 2a 00 20 00    	mov    edi,DWORD PTR [esi+0x20002a]
  47df35:	0f b7 da             	movzx  ebx,dx
  47df38:	c1 e3 02             	shl    ebx,0x2
  47df3b:	8b 4c 24 24          	mov    ecx,DWORD PTR [esp+0x24]
  47df3f:	33 c0                	xor    eax,eax
  47df41:	8d 1c db             	lea    ebx,[ebx+ebx*8]
  47df44:	03 59 04             	add    ebx,DWORD PTR [ecx+0x4]
  47df47:	66 8b 03             	mov    ax,WORD PTR [ebx]
  47df4a:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47df4e:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47df52:	d8 5c 24 1c          	fcomp  DWORD PTR [esp+0x1c]
  47df56:	df e0                	fnstsw ax
  47df58:	f6 c4 40             	test   ah,0x40
  47df5b:	74 19                	je     0x47df76
  47df5d:	33 c0                	xor    eax,eax
  47df5f:	66 8b 43 02          	mov    ax,WORD PTR [ebx+0x2]
  47df63:	89 44 24 0c          	mov    DWORD PTR [esp+0xc],eax
  47df67:	db 44 24 0c          	fild   DWORD PTR [esp+0xc]
  47df6b:	d8 5c 24 20          	fcomp  DWORD PTR [esp+0x20]
  47df6f:	df e0                	fnstsw ax
  47df71:	f6 c4 40             	test   ah,0x40
  47df74:	75 04                	jne    0x47df7a
  47df76:	83 4f 20 20          	or     DWORD PTR [edi+0x20],0x20
  47df7a:	8b 44 24 30          	mov    eax,DWORD PTR [esp+0x30]
  47df7e:	68 00 00 80 bf       	push   0xbf800000
  47df83:	68 00 00 80 bf       	push   0xbf800000
  47df88:	50                   	push   eax
  47df89:	8b 44 24 24          	mov    eax,DWORD PTR [esp+0x24]
  47df8d:	52                   	push   edx
  47df8e:	8b 54 24 2c          	mov    edx,DWORD PTR [esp+0x2c]
  47df92:	51                   	push   ecx
  47df93:	8b 4c 24 34          	mov    ecx,DWORD PTR [esp+0x34]
  47df97:	51                   	push   ecx
  47df98:	52                   	push   edx
  47df99:	8b 4c 24 30          	mov    ecx,DWORD PTR [esp+0x30]
  47df9d:	50                   	push   eax
  47df9e:	51                   	push   ecx
  47df9f:	8b cf                	mov    ecx,edi
  47dfa1:	e8 fa b5 07 00       	call   0x4f95a0
  47dfa6:	8b 4f 4e             	mov    ecx,DWORD PTR [edi+0x4e]
  47dfa9:	8b 54 24 2c          	mov    edx,DWORD PTR [esp+0x2c]
  47dfad:	33 d1                	xor    edx,ecx
  47dfaf:	81 e2 ff ff ff 00    	and    edx,0xffffff
  47dfb5:	33 d1                	xor    edx,ecx
  47dfb7:	89 57 4e             	mov    DWORD PTR [edi+0x4e],edx
  47dfba:	66 ff 46 1c          	inc    WORD PTR [esi+0x1c]
  47dfbe:	01 86 2a 00 20 00    	add    DWORD PTR [esi+0x20002a],eax
  47dfc4:	5f                   	pop    edi
  47dfc5:	5e                   	pop    esi
  47dfc6:	5b                   	pop    ebx
  47dfc7:	83 c4 04             	add    esp,0x4
  47dfca:	c2 20 00             	ret    0x20
  47dfcd:	cc                   	int3
  47dfce:	cc                   	int3
  47dfcf:	cc                   	int3
  47dfd0:	66 8b 54 24 20       	mov    dx,WORD PTR [esp+0x20]
  47dfd5:	53                   	push   ebx
  47dfd6:	0f b7 c2             	movzx  eax,dx
  47dfd9:	c1 e0 02             	shl    eax,0x2
  47dfdc:	56                   	push   esi
  47dfdd:	57                   	push   edi
  47dfde:	8b f1                	mov    esi,ecx
  47dfe0:	8d 04 c0             	lea    eax,[eax+eax*8]
  47dfe3:	8b 4c 24 28          	mov    ecx,DWORD PTR [esp+0x28]
  47dfe7:	33 db                	xor    ebx,ebx
  47dfe9:	8b 79 04             	mov    edi,DWORD PTR [ecx+0x4]
  47dfec:	39 5c 38 14          	cmp    DWORD PTR [eax+edi*1+0x14],ebx
