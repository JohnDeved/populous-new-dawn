
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00511020 <.text+0x110020>:
  511020:	83 ec 08             	sub    esp,0x8
  511023:	8b 4c 24 10          	mov    ecx,DWORD PTR [esp+0x10]
  511027:	53                   	push   ebx
  511028:	56                   	push   esi
  511029:	57                   	push   edi
  51102a:	8b 74 24 18          	mov    esi,DWORD PTR [esp+0x18]
  51102e:	55                   	push   ebp
  51102f:	0f bf 41 3d          	movsx  eax,WORD PTR [ecx+0x3d]
  511033:	66 8b 7e 3d          	mov    di,WORD PTR [esi+0x3d]
  511037:	0f bf d7             	movsx  edx,di
  51103a:	2b c2                	sub    eax,edx
  51103c:	3d 00 80 00 00       	cmp    eax,0x8000
  511041:	7e 07                	jle    0x51104a
  511043:	2d 00 00 01 00       	sub    eax,0x10000
  511048:	eb 0c                	jmp    0x511056
  51104a:	3d 00 80 ff ff       	cmp    eax,0xffff8000
  51104f:	7d 05                	jge    0x511056
  511051:	05 00 00 01 00       	add    eax,0x10000
  511056:	0f bf 59 3f          	movsx  ebx,WORD PTR [ecx+0x3f]
  51105a:	0f bf 4e 3f          	movsx  ecx,WORD PTR [esi+0x3f]
  51105e:	2b d9                	sub    ebx,ecx
  511060:	81 fb 00 80 00 00    	cmp    ebx,0x8000
  511066:	7e 08                	jle    0x511070
  511068:	81 eb 00 00 01 00    	sub    ebx,0x10000
  51106e:	eb 0e                	jmp    0x51107e
  511070:	81 fb 00 80 ff ff    	cmp    ebx,0xffff8000
  511076:	7d 06                	jge    0x51107e
  511078:	81 c3 00 00 01 00    	add    ebx,0x10000
  51107e:	8b c8                	mov    ecx,eax
  511080:	85 c0                	test   eax,eax
  511082:	7d 04                	jge    0x511088
  511084:	8b c8                	mov    ecx,eax
  511086:	f7 d9                	neg    ecx
  511088:	8b d3                	mov    edx,ebx
  51108a:	85 db                	test   ebx,ebx
  51108c:	7d 04                	jge    0x511092
  51108e:	8b d3                	mov    edx,ebx
  511090:	f7 da                	neg    edx
  511092:	8d 2c 11             	lea    ebp,[ecx+edx*1]
  511095:	85 ed                	test   ebp,ebp
  511097:	75 05                	jne    0x51109e
  511099:	bd 01 00 00 00       	mov    ebp,0x1
  51109e:	c1 e0 05             	shl    eax,0x5
  5110a1:	99                   	cdq
  5110a2:	66 8b 4e 49          	mov    cx,WORD PTR [esi+0x49]
  5110a6:	f7 fd                	idiv   ebp
  5110a8:	66 03 c8             	add    cx,ax
  5110ab:	8b c3                	mov    eax,ebx
  5110ad:	c1 e0 05             	shl    eax,0x5
  5110b0:	99                   	cdq
  5110b1:	66 89 4e 49          	mov    WORD PTR [esi+0x49],cx
  5110b5:	f7 fd                	idiv   ebp
  5110b7:	66 03 46 4d          	add    ax,WORD PTR [esi+0x4d]
  5110bb:	66 89 46 4d          	mov    WORD PTR [esi+0x4d],ax
  5110bf:	66 83 f9 80          	cmp    cx,0xff80
  5110c3:	7d 06                	jge    0x5110cb
  5110c5:	66 c7 46 49 80 ff    	mov    WORD PTR [esi+0x49],0xff80
  5110cb:	66 81 7e 49 80 00    	cmp    WORD PTR [esi+0x49],0x80
  5110d1:	7e 06                	jle    0x5110d9
  5110d3:	66 c7 46 49 80 00    	mov    WORD PTR [esi+0x49],0x80
  5110d9:	66 3d 80 ff          	cmp    ax,0xff80
  5110dd:	7d 06                	jge    0x5110e5
  5110df:	66 c7 46 4d 80 ff    	mov    WORD PTR [esi+0x4d],0xff80
  5110e5:	66 81 7e 4d 80 00    	cmp    WORD PTR [esi+0x4d],0x80
  5110eb:	7e 06                	jle    0x5110f3
  5110ed:	66 c7 46 4d 80 00    	mov    WORD PTR [esi+0x4d],0x80
  5110f3:	66 8b 46 49          	mov    ax,WORD PTR [esi+0x49]
  5110f7:	66 03 c7             	add    ax,di
  5110fa:	66 8b 4e 41          	mov    cx,WORD PTR [esi+0x41]
  5110fe:	66 89 44 24 10       	mov    WORD PTR [esp+0x10],ax
  511103:	66 8b 46 4d          	mov    ax,WORD PTR [esi+0x4d]
  511107:	66 89 4c 24 14       	mov    WORD PTR [esp+0x14],cx
  51110c:	8d 4c 24 10          	lea    ecx,[esp+0x10]
  511110:	66 03 46 3f          	add    ax,WORD PTR [esi+0x3f]
  511114:	66 89 44 24 12       	mov    WORD PTR [esp+0x12],ax
  511119:	51                   	push   ecx
  51111a:	56                   	push   esi
  51111b:	e8 60 d4 fd ff       	call   0x4ee580
  511120:	66 8b 4e 3f          	mov    cx,WORD PTR [esi+0x3f]
  511124:	83 c4 08             	add    esp,0x8
  511127:	66 8b 56 3d          	mov    dx,WORD PTR [esi+0x3d]
  51112b:	51                   	push   ecx
  51112c:	52                   	push   edx
  51112d:	e8 0e d8 f3 ff       	call   0x44e940
  511132:	66 8b 7e 72          	mov    di,WORD PTR [esi+0x72]
  511136:	83 c4 08             	add    esp,0x8
  511139:	0f bf c8             	movsx  ecx,ax
  51113c:	0f bf c7             	movsx  eax,di
  51113f:	8d 1c 08             	lea    ebx,[eax+ecx*1]
  511142:	66 8b 46 41          	mov    ax,WORD PTR [esi+0x41]
  511146:	0f bf d0             	movsx  edx,ax
  511149:	3b d3                	cmp    edx,ebx
  51114b:	7e 16                	jle    0x511163
  51114d:	66 2d 23 00          	sub    ax,0x23
  511151:	0f bf d0             	movsx  edx,ax
  511154:	66 89 46 41          	mov    WORD PTR [esi+0x41],ax
  511158:	3b d3                	cmp    edx,ebx
  51115a:	7d 07                	jge    0x511163
  51115c:	66 03 f9             	add    di,cx
  51115f:	66 89 7e 41          	mov    WORD PTR [esi+0x41],di
  511163:	0f bf 46 41          	movsx  eax,WORD PTR [esi+0x41]
  511167:	3b c1                	cmp    eax,ecx
  511169:	7d 08                	jge    0x511173
  51116b:	66 83 c1 02          	add    cx,0x2
  51116f:	66 89 4e 41          	mov    WORD PTR [esi+0x41],cx
  511173:	5d                   	pop    ebp
  511174:	5f                   	pop    edi
  511175:	5e                   	pop    esi
  511176:	5b                   	pop    ebx
  511177:	83 c4 08             	add    esp,0x8
  51117a:	c3                   	ret
  51117b:	cc                   	int3
  51117c:	cc                   	int3
  51117d:	cc                   	int3
  51117e:	cc                   	int3
  51117f:	cc                   	int3
