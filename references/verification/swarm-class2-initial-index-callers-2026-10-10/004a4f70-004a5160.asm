
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004a4f70 <.text+0xa3f70>:
  4a4f70:	83 ec 5c             	sub    esp,0x5c
  4a4f73:	56                   	push   esi
  4a4f74:	57                   	push   edi
  4a4f75:	6a 00                	push   0x0
  4a4f77:	6a 00                	push   0x0
  4a4f79:	6a 00                	push   0x0
  4a4f7b:	6a 65                	push   0x65
  4a4f7d:	e8 5e 57 08 00       	call   0x52a6e0
  4a4f82:	50                   	push   eax
  4a4f83:	ff 15 b8 c8 d0 00    	call   DWORD PTR ds:0xd0c8b8
  4a4f89:	8b f0                	mov    esi,eax
  4a4f8b:	85 f6                	test   esi,esi
  4a4f8d:	74 44                	je     0x4a4fd3
  4a4f8f:	a1 d8 2f 97 00       	mov    eax,ds:0x972fd8
  4a4f94:	8d 4c 24 24          	lea    ecx,[esp+0x24]
  4a4f98:	50                   	push   eax
  4a4f99:	51                   	push   ecx
  4a4f9a:	e8 f1 56 ff ff       	call   0x49a690
  4a4f9f:	8d 4c 24 2c          	lea    ecx,[esp+0x2c]
  4a4fa3:	83 c4 08             	add    esp,0x8
  4a4fa6:	51                   	push   ecx
  4a4fa7:	56                   	push   esi
  4a4fa8:	ff 15 bc c8 d0 00    	call   DWORD PTR ds:0xd0c8bc
  4a4fae:	8b 0d b4 33 97 00    	mov    ecx,DWORD PTR ds:0x9733b4
  4a4fb4:	8d 44 24 24          	lea    eax,[esp+0x24]
  4a4fb8:	51                   	push   ecx
  4a4fb9:	50                   	push   eax
  4a4fba:	e8 d1 56 ff ff       	call   0x49a690
  4a4fbf:	8d 4c 24 2c          	lea    ecx,[esp+0x2c]
  4a4fc3:	83 c4 08             	add    esp,0x8
  4a4fc6:	51                   	push   ecx
  4a4fc7:	68 e9 03 00 00       	push   0x3e9
  4a4fcc:	56                   	push   esi
  4a4fcd:	ff 15 c0 c8 d0 00    	call   DWORD PTR ds:0xd0c8c0
  4a4fd3:	6a 00                	push   0x0
  4a4fd5:	ff 15 5c c9 d0 00    	call   DWORD PTR ds:0xd0c95c
  4a4fdb:	e8 20 48 ff ff       	call   0x499800
  4a4fe0:	6a 00                	push   0x0
  4a4fe2:	6a 00                	push   0x0
  4a4fe4:	6a 00                	push   0x0
  4a4fe6:	6a 07                	push   0x7
  4a4fe8:	e8 f3 5f ff ff       	call   0x49afe0
  4a4fed:	83 c4 10             	add    esp,0x10
  4a4ff0:	6a 00                	push   0x0
  4a4ff2:	6a 00                	push   0x0
  4a4ff4:	6a 00                	push   0x0
  4a4ff6:	6a 08                	push   0x8
  4a4ff8:	e8 e3 5f ff ff       	call   0x49afe0
  4a4ffd:	83 c4 10             	add    esp,0x10
  4a5000:	e8 9b 50 f8 ff       	call   0x42a0a0
  4a5005:	e8 06 e2 fe ff       	call   0x493210
  4a500a:	85 c0                	test   eax,eax
  4a500c:	74 05                	je     0x4a5013
  4a500e:	e8 bd fa fa ff       	call   0x454ad0
  4a5013:	e8 58 5c f8 ff       	call   0x42ac70
  4a5018:	68 70 34 5a 00       	push   0x5a3470
  4a501d:	e8 ce 6d ff ff       	call   0x49bdf0
  4a5022:	83 c4 04             	add    esp,0x4
  4a5025:	a1 f8 ef 87 00       	mov    eax,ds:0x87eff8
  4a502a:	a3 24 df 59 00       	mov    ds:0x59df24,eax
  4a502f:	e8 6c 61 f8 ff       	call   0x42b1a0
  4a5034:	6a 00                	push   0x0
  4a5036:	68 70 34 5a 00       	push   0x5a3470
  4a503b:	6a 00                	push   0x0
  4a503d:	6a 01                	push   0x1
  4a503f:	e8 9c 5f ff ff       	call   0x49afe0
  4a5044:	83 c4 10             	add    esp,0x10
  4a5047:	6a 00                	push   0x0
  4a5049:	e8 f2 50 f8 ff       	call   0x42a140
  4a504e:	83 c4 04             	add    esp,0x4
  4a5051:	6a 00                	push   0x0
  4a5053:	e8 28 54 f8 ff       	call   0x42a480
  4a5058:	83 c4 04             	add    esp,0x4
  4a505b:	e8 c0 4b f8 ff       	call   0x429c20
  4a5060:	e8 7b 6d f8 ff       	call   0x42bde0
  4a5065:	e8 46 1d f7 ff       	call   0x416db0
  4a506a:	e8 71 1d f7 ff       	call   0x416de0
  4a506f:	e8 8c 1f f7 ff       	call   0x417000
  4a5074:	68 e0 01 00 00       	push   0x1e0
  4a5079:	68 80 02 00 00       	push   0x280
  4a507e:	e8 6d 21 f7 ff       	call   0x4171f0
  4a5083:	83 c4 08             	add    esp,0x8
  4a5086:	a2 ee c6 89 00       	mov    ds:0x89c6ee,al
  4a508b:	e8 80 22 f7 ff       	call   0x417310
  4a5090:	6a 02                	push   0x2
  4a5092:	e8 79 02 00 00       	call   0x4a5310
  4a5097:	83 c4 04             	add    esp,0x4
  4a509a:	a1 6e bc 89 00       	mov    eax,ds:0x89bc6e
  4a509f:	50                   	push   eax
  4a50a0:	e8 2b c5 04 00       	call   0x4f15d0
  4a50a5:	83 c4 04             	add    esp,0x4
  4a50a8:	a1 61 c6 89 00       	mov    eax,ds:0x89c661
  4a50ad:	25 00 80 00 00       	and    eax,0x8000
  4a50b2:	83 f8 01             	cmp    eax,0x1
  4a50b5:	1b c0                	sbb    eax,eax
  4a50b7:	f7 d8                	neg    eax
  4a50b9:	50                   	push   eax
  4a50ba:	e8 61 c7 04 00       	call   0x4f1820
  4a50bf:	8d 4c 24 0c          	lea    ecx,[esp+0xc]
  4a50c3:	83 c4 04             	add    esp,0x4
  4a50c6:	e8 55 d3 07 00       	call   0x522420
  4a50cb:	83 7c 24 08 00       	cmp    DWORD PTR [esp+0x8],0x0
  4a50d0:	b8 04 00 00 00       	mov    eax,0x4
  4a50d5:	74 0c                	je     0x4a50e3
  4a50d7:	8b 44 24 08          	mov    eax,DWORD PTR [esp+0x8]
  4a50db:	25 00 0f 00 00       	and    eax,0xf00
  4a50e0:	c1 e8 08             	shr    eax,0x8
  4a50e3:	83 f8 06             	cmp    eax,0x6
  4a50e6:	b8 01 00 00 00       	mov    eax,0x1
  4a50eb:	7d 02                	jge    0x4a50ef
  4a50ed:	33 c0                	xor    eax,eax
  4a50ef:	50                   	push   eax
  4a50f0:	e8 1d 5f 87 00       	call   0xd1b012
  4a50f5:	83 c4 04             	add    esp,0x4
  4a50f8:	a0 50 c6 89 00       	mov    al,ds:0x89c650
  4a50fd:	a2 c0 ea 96 00       	mov    ds:0x96eac0,al
  4a5102:	a2 bf ea 96 00       	mov    ds:0x96eabf,al
  4a5107:	e8 94 6e f8 ff       	call   0x42bfa0
  4a510c:	e8 3f 8a fb ff       	call   0x45db50
  4a5111:	e8 aa d5 00 00       	call   0x4b26c0
  4a5116:	e8 15 70 f8 ff       	call   0x42c130
  4a511b:	e8 00 6e f8 ff       	call   0x42bf20
  4a5120:	e8 4b 70 f8 ff       	call   0x42c170
  4a5125:	e8 f6 86 04 00       	call   0x4ed820
  4a512a:	e8 51 87 04 00       	call   0x4ed880
  4a512f:	e8 1c 70 f8 ff       	call   0x42c150
  4a5134:	e8 c7 91 04 00       	call   0x4ee300
  4a5139:	e8 42 e8 f9 ff       	call   0x443980
  4a513e:	e8 fd 64 ff ff       	call   0x49b640
  4a5143:	e8 28 54 f8 ff       	call   0x42a570
  4a5148:	84 c0                	test   al,al
  4a514a:	75 0a                	jne    0x4a5156
  4a514c:	6a 00                	push   0x0
  4a514e:	e8 8d b8 05 00       	call   0x5009e0
  4a5153:	83 c4 04             	add    esp,0x4
  4a5156:	e8 c5 7c 01 00       	call   0x4bce20
  4a515b:	e8 c0 dc f5 ff       	call   0x402e20
