
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004df140 <.text+0xde140>:
  4df140:	53                   	push   ebx
  4df141:	32 c0                	xor    al,al
  4df143:	8b 54 24 08          	mov    edx,DWORD PTR [esp+0x8]
  4df147:	56                   	push   esi
  4df148:	8a 4a 2c             	mov    cl,BYTE PTR [edx+0x2c]
  4df14b:	80 f9 0a             	cmp    cl,0xa
  4df14e:	74 05                	je     0x4df155
  4df150:	80 f9 21             	cmp    cl,0x21
  4df153:	75 59                	jne    0x4df1ae
  4df155:	33 f6                	xor    esi,esi
  4df157:	33 c9                	xor    ecx,ecx
  4df159:	66 8b 8a 9b 00 00 00 	mov    cx,WORD PTR [edx+0x9b]
  4df160:	3b ce                	cmp    ecx,esi
  4df162:	75 16                	jne    0x4df17a
  4df164:	33 db                	xor    ebx,ebx
  4df166:	33 c9                	xor    ecx,ecx
  4df168:	8a 9a a6 00 00 00    	mov    bl,BYTE PTR [edx+0xa6]
  4df16e:	66 8b 8c 5a 8b 00 00 	mov    cx,WORD PTR [edx+ebx*2+0x8b]
  4df175:	00
  4df176:	85 c9                	test   ecx,ecx
  4df178:	74 0a                	je     0x4df184
  4df17a:	8d 0c 89             	lea    ecx,[ecx+ecx*4]
  4df17d:	8d 34 4d 30 88 93 00 	lea    esi,[ecx*2+0x938830]
  4df184:	85 f6                	test   esi,esi
  4df186:	74 26                	je     0x4df1ae
  4df188:	f6 46 01 01          	test   BYTE PTR [esi+0x1],0x1
  4df18c:	75 20                	jne    0x4df1ae
  4df18e:	8a 0e                	mov    cl,BYTE PTR [esi]
  4df190:	80 f9 11             	cmp    cl,0x11
  4df193:	74 0a                	je     0x4df19f
  4df195:	80 f9 1f             	cmp    cl,0x1f
  4df198:	74 05                	je     0x4df19f
  4df19a:	80 f9 20             	cmp    cl,0x20
  4df19d:	75 0f                	jne    0x4df1ae
  4df19f:	80 7a 2d 01          	cmp    BYTE PTR [edx+0x2d],0x1
  4df1a3:	76 09                	jbe    0x4df1ae
  4df1a5:	66 83 7a 5f 00       	cmp    WORD PTR [edx+0x5f],0x0
  4df1aa:	75 02                	jne    0x4df1ae
  4df1ac:	b0 01                	mov    al,0x1
  4df1ae:	5e                   	pop    esi
  4df1af:	5b                   	pop    ebx
  4df1b0:	c3                   	ret
