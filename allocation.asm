
../prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004ed8a0 <.text+0xec8a0>:
  4ed8a0:	83 ec 0c             	sub    $0xc,%esp
  4ed8a3:	33 d2                	xor    %edx,%edx
  4ed8a5:	8a 54 24 10          	mov    0x10(%esp),%dl
  4ed8a9:	53                   	push   %ebx
  4ed8aa:	56                   	push   %esi
  4ed8ab:	32 c0                	xor    %al,%al
  4ed8ad:	8d b4 52 30 68 5a 00 	lea    0x5a6830(%edx,%edx,2),%esi
  4ed8b4:	57                   	push   %edi
  4ed8b5:	55                   	push   %ebp
  4ed8b6:	8d 1c 52             	lea    (%edx,%edx,2),%ebx
  4ed8b9:	8a 4e 02             	mov    0x2(%esi),%cl
  4ed8bc:	f6 c1 01             	test   $0x1,%cl
  4ed8bf:	75 3b                	jne    0x4ed8fc
  4ed8c1:	f6 c1 40             	test   $0x40,%cl
  4ed8c4:	74 38                	je     0x4ed8fe
  4ed8c6:	83 fa 05             	cmp    $0x5,%edx
  4ed8c9:	75 33                	jne    0x4ed8fe
  4ed8cb:	33 c9                	xor    %ecx,%ecx
  4ed8cd:	8a 4c 24 24          	mov    0x24(%esp),%cl
  4ed8d1:	8d 2c 49             	lea    (%ecx,%ecx,2),%ebp
  4ed8d4:	8b 0c ed c4 79 5a 00 	mov    0x5a79c4(,%ebp,8),%ecx
  4ed8db:	f7 c1 00 00 00 01    	test   $0x1000000,%ecx
  4ed8e1:	74 02                	je     0x4ed8e5
  4ed8e3:	b0 01                	mov    $0x1,%al
  4ed8e5:	f7 c1 00 00 00 02    	test   $0x2000000,%ecx
  4ed8eb:	74 11                	je     0x4ed8fe
  4ed8ed:	fe 05 d5 ea 96 00    	incb   0x96ead5
  4ed8f3:	f6 05 d5 ea 96 00 01 	testb  $0x1,0x96ead5
  4ed8fa:	74 02                	je     0x4ed8fe
  4ed8fc:	b0 01                	mov    $0x1,%al
  4ed8fe:	84 c0                	test   %al,%al
  4ed900:	75 5d                	jne    0x4ed95f
  4ed902:	a1 51 c6 89 00       	mov    0x89c651,%eax
  4ed907:	2b 05 59 c6 89 00    	sub    0x89c659,%eax
  4ed90d:	3d 4c 04 00 00       	cmp    $0x44c,%eax
  4ed912:	7e 43                	jle    0x4ed957
  4ed914:	8a 46 02             	mov    0x2(%esi),%al
  4ed917:	a8 02                	test   $0x2,%al
  4ed919:	74 1f                	je     0x4ed93a
  4ed91b:	81 3d 59 c6 89 00 50 	cmpl   $0x250,0x89c659
  4ed922:	02 00 00 
  4ed925:	7e 08                	jle    0x4ed92f
  4ed927:	8b 35 1c 03 89 00    	mov    0x89031c,%esi
  4ed92d:	eb 36                	jmp    0x4ed965
  4ed92f:	83 3d 20 03 89 00 00 	cmpl   $0x0,0x890320
  4ed936:	75 27                	jne    0x4ed95f
  4ed938:	eb 1d                	jmp    0x4ed957
  4ed93a:	83 3d 1c 03 89 00 00 	cmpl   $0x0,0x89031c
  4ed941:	75 0c                	jne    0x4ed94f
  4ed943:	a8 04                	test   $0x4,%al
  4ed945:	75 18                	jne    0x4ed95f
  4ed947:	8b 35 1c 03 89 00    	mov    0x89031c,%esi
  4ed94d:	eb 16                	jmp    0x4ed965
  4ed94f:	8b 35 1c 03 89 00    	mov    0x89031c,%esi
  4ed955:	eb 0e                	jmp    0x4ed965
  4ed957:	8b 35 1c 03 89 00    	mov    0x89031c,%esi
  4ed95d:	eb 06                	jmp    0x4ed965
  4ed95f:	8b 35 20 03 89 00    	mov    0x890320,%esi
  4ed965:	85 f6                	test   %esi,%esi
  4ed967:	0f 84 42 01 00 00    	je     0x4edaaf
  4ed96d:	66 81 7e 24 80 02    	cmpw   $0x280,0x24(%esi)
  4ed973:	8b 06                	mov    (%esi),%eax
  4ed975:	72 19                	jb     0x4ed990
  4ed977:	8d 6e 04             	lea    0x4(%esi),%ebp
  4ed97a:	85 c0                	test   %eax,%eax
  4ed97c:	74 08                	je     0x4ed986
  4ed97e:	8b 4d 00             	mov    0x0(%ebp),%ecx
  4ed981:	89 48 04             	mov    %ecx,0x4(%eax)
  4ed984:	eb 21                	jmp    0x4ed9a7
  4ed986:	8b 45 00             	mov    0x0(%ebp),%eax
  4ed989:	a3 1c 03 89 00       	mov    %eax,0x89031c
  4ed98e:	eb 17                	jmp    0x4ed9a7
  4ed990:	8d 6e 04             	lea    0x4(%esi),%ebp
  4ed993:	85 c0                	test   %eax,%eax
  4ed995:	74 08                	je     0x4ed99f
  4ed997:	8b 4d 00             	mov    0x0(%ebp),%ecx
  4ed99a:	89 48 04             	mov    %ecx,0x4(%eax)
  4ed99d:	eb 08                	jmp    0x4ed9a7
  4ed99f:	8b 45 00             	mov    0x0(%ebp),%eax
  4ed9a2:	a3 20 03 89 00       	mov    %eax,0x890320
  4ed9a7:	8b 45 00             	mov    0x0(%ebp),%eax
  4ed9aa:	85 c0                	test   %eax,%eax
  4ed9ac:	74 04                	je     0x4ed9b2
  4ed9ae:	8b 0e                	mov    (%esi),%ecx
  4ed9b0:	89 08                	mov    %ecx,(%eax)
  4ed9b2:	c7 06 00 00 00 00    	movl   $0x0,(%esi)
  4ed9b8:	a1 24 03 89 00       	mov    0x890324,%eax
  4ed9bd:	89 45 00             	mov    %eax,0x0(%ebp)
  4ed9c0:	89 35 24 03 89 00    	mov    %esi,0x890324
  4ed9c6:	8b 45 00             	mov    0x0(%ebp),%eax
  4ed9c9:	85 c0                	test   %eax,%eax
  4ed9cb:	74 02                	je     0x4ed9cf
  4ed9cd:	89 30                	mov    %esi,(%eax)
  4ed9cf:	8b 45 00             	mov    0x0(%ebp),%eax
  4ed9d2:	8b 0e                	mov    (%esi),%ecx
  4ed9d4:	8b fe                	mov    %esi,%edi
  4ed9d6:	89 44 24 14          	mov    %eax,0x14(%esp)
  4ed9da:	66 8b 46 24          	mov    0x24(%esi),%ax
  4ed9de:	89 4c 24 18          	mov    %ecx,0x18(%esp)
  4ed9e2:	66 89 44 24 12       	mov    %ax,0x12(%esp)
  4ed9e7:	b9 2c 00 00 00       	mov    $0x2c,%ecx
  4ed9ec:	33 c0                	xor    %eax,%eax
  4ed9ee:	f3 ab                	rep stos %eax,%es:(%edi)
  4ed9f0:	66 ab                	stos   %ax,%es:(%edi)
  4ed9f2:	aa                   	stos   %al,%es:(%edi)
  4ed9f3:	66 8b 44 24 12       	mov    0x12(%esp),%ax
  4ed9f8:	8b 4c 24 14          	mov    0x14(%esp),%ecx
  4ed9fc:	66 89 46 24          	mov    %ax,0x24(%esi)
  4eda00:	89 4d 00             	mov    %ecx,0x0(%ebp)
  4eda03:	8b 6c 24 18          	mov    0x18(%esp),%ebp
  4eda07:	89 2e                	mov    %ebp,(%esi)
  4eda09:	ff 05 51 c6 89 00    	incl   0x89c651
  4eda0f:	66 81 7e 24 80 02    	cmpw   $0x280,0x24(%esi)
  4eda15:	73 06                	jae    0x4eda1d
  4eda17:	ff 05 59 c6 89 00    	incl   0x89c659
  4eda1d:	ff 05 80 d1 89 00    	incl   0x89d180
  4eda23:	8a 82 c1 ea 96 00    	mov    0x96eac1(%edx),%al
  4eda29:	88 46 2e             	mov    %al,0x2e(%esi)
  4eda2c:	f6 83 31 68 5a 00 10 	testb  $0x10,0x5a6831(%ebx)
  4eda33:	75 06                	jne    0x4eda3b
  4eda35:	fe 82 c1 ea 96 00    	incb   0x96eac1(%edx)
  4eda3b:	8a 44 24 20          	mov    0x20(%esp),%al
  4eda3f:	8a 4c 24 24          	mov    0x24(%esp),%cl
  4eda43:	8a 54 24 28          	mov    0x28(%esp),%dl
  4eda47:	88 46 2a             	mov    %al,0x2a(%esi)
  4eda4a:	8b 44 24 2c          	mov    0x2c(%esp),%eax
  4eda4e:	88 4e 2b             	mov    %cl,0x2b(%esi)
  4eda51:	88 56 2f             	mov    %dl,0x2f(%esi)
  4eda54:	8d 56 3d             	lea    0x3d(%esi),%edx
  4eda57:	8b 08                	mov    (%eax),%ecx
  4eda59:	89 0a                	mov    %ecx,(%edx)
  4eda5b:	33 c9                	xor    %ecx,%ecx
  4eda5d:	66 8b 40 04          	mov    0x4(%eax),%ax
  4eda61:	66 89 42 04          	mov    %ax,0x4(%edx)
  4eda65:	89 4e 0c             	mov    %ecx,0xc(%esi)
  4eda68:	89 4e 10             	mov    %ecx,0x10(%esi)
  4eda6b:	89 4e 14             	mov    %ecx,0x14(%esi)
  4eda6e:	66 89 4e 43          	mov    %cx,0x43(%esi)
  4eda72:	66 89 4e 45          	mov    %cx,0x45(%esi)
  4eda76:	66 89 4e 47          	mov    %cx,0x47(%esi)
  4eda7a:	66 89 4e 28          	mov    %cx,0x28(%esi)
  4eda7e:	8b 15 81 79 89 00    	mov    0x897981,%edx
  4eda84:	89 56 18             	mov    %edx,0x18(%esi)
  4eda87:	38 0d 37 ce 89 00    	cmp    %cl,0x89ce37
  4eda8d:	75 37                	jne    0x4edac6
  4eda8f:	38 0d 3a 24 89 00    	cmp    %cl,0x89243a
  4eda95:	74 0d                	je     0x4edaa4
  4eda97:	81 4e 0c 00 04 00 00 	orl    $0x400,0xc(%esi)
  4eda9e:	88 0d 3a 24 89 00    	mov    %cl,0x89243a
  4edaa4:	56                   	push   %esi
  4edaa5:	e8 d6 fa ff ff       	call   0x4ed580
  4edaaa:	83 c4 04             	add    $0x4,%esp
  4edaad:	eb 17                	jmp    0x4edac6
  4edaaf:	80 3d 3a 24 89 00 00 	cmpb   $0x0,0x89243a
  4edab6:	74 0e                	je     0x4edac6
  4edab8:	83 2d 43 24 89 00 14 	subl   $0x14,0x892443
  4edabf:	c6 05 3a 24 89 00 00 	movb   $0x0,0x89243a
  4edac6:	8b c6                	mov    %esi,%eax
  4edac8:	5d                   	pop    %ebp
  4edac9:	c6 05 37 ce 89 00 00 	movb   $0x0,0x89ce37
  4edad0:	5f                   	pop    %edi
  4edad1:	5e                   	pop    %esi
  4edad2:	5b                   	pop    %ebx
  4edad3:	83 c4 0c             	add    $0xc,%esp
  4edad6:	c3                   	ret
