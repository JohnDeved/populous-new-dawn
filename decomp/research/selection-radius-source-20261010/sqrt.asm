
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section CSEG:

00586000 <CSEG>:
  586000:	83 ec 04             	sub    esp,0x4
  586003:	53                   	push   ebx
  586004:	51                   	push   ecx
  586005:	52                   	push   edx
  586006:	8b 4c 24 14          	mov    ecx,DWORD PTR [esp+0x14]
  58600a:	0b c9                	or     ecx,ecx
  58600c:	74 1b                	je     0x586029
  58600e:	0f bd c1             	bsr    eax,ecx
  586011:	0f b7 1c 45 34 60 58 	movzx  ebx,WORD PTR [eax*2+0x586034]
  586018:	00 
  586019:	8b c1                	mov    eax,ecx
  58601b:	33 d2                	xor    edx,edx
  58601d:	f7 f3                	div    ebx
  58601f:	3b c3                	cmp    eax,ebx
  586021:	7d 08                	jge    0x58602b
  586023:	03 d8                	add    ebx,eax
  586025:	d1 eb                	shr    ebx,1
  586027:	eb f0                	jmp    0x586019
  586029:	33 db                	xor    ebx,ebx
  58602b:	8b c3                	mov    eax,ebx
  58602d:	5a                   	pop    edx
  58602e:	59                   	pop    ecx
  58602f:	5b                   	pop    ebx
  586030:	83 c4 04             	add    esp,0x4
  586033:	c3                   	ret
  586034:	01 00                	add    DWORD PTR [eax],eax
  586036:	02 00                	add    al,BYTE PTR [eax]
  586038:	02 00                	add    al,BYTE PTR [eax]
  58603a:	04 00                	add    al,0x0
  58603c:	05 00 08 00 0b       	add    eax,0xb000800
  586041:	00 10                	add    BYTE PTR [eax],dl
  586043:	00 16                	add    BYTE PTR [esi],dl
  586045:	00 20                	add    BYTE PTR [eax],ah
  586047:	00 2d 00 40 00 5a    	add    BYTE PTR ds:0x5a004000,ch
  58604d:	00 80 00 b5 00 00    	add    BYTE PTR [eax+0xb500],al
  586053:	01 6a 01             	add    DWORD PTR [edx+0x1],ebp
  586056:	00 02                	add    BYTE PTR [edx],al
  586058:	d4 02                	aam    0x2
  58605a:	00 04 a8             	add    BYTE PTR [eax+ebp*4],al
  58605d:	05 00 08 50 0b       	add    eax,0xb500800
  586062:	00 10                	add    BYTE PTR [eax],dl
  586064:	a0 16 00 20 41       	mov    al,ds:0x41200016
  586069:	2d 00 40 82 5a       	sub    eax,0x5a824000
  58606e:	00 80 04 b5 ff ff    	add    BYTE PTR [eax-0x4afc],al
