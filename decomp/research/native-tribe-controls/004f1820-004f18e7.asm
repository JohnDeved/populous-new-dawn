
004f1820-004f18e7.bin:     file format binary


Disassembly of section .data:

004f1820 <.data>:
  4f1820:	64 a1 00 00 00 00    	mov    eax,fs:0x0
  4f1826:	55                   	push   ebp
  4f1827:	8b ec                	mov    ebp,esp
  4f1829:	6a ff                	push   0xffffffff
  4f182b:	68 e7 18 4f 00       	push   0x4f18e7
  4f1830:	50                   	push   eax
  4f1831:	64 89 25 00 00 00 00 	mov    DWORD PTR fs:0x0,esp
  4f1838:	81 ec 24 02 00 00    	sub    esp,0x224
  4f183e:	56                   	push   esi
  4f183f:	68 04 04 00 00       	push   0x404
  4f1844:	e8 57 94 06 00       	call   0x55aca0
  4f1849:	89 45 f0             	mov    DWORD PTR [ebp-0x10],eax
  4f184c:	83 c4 04             	add    esp,0x4
  4f184f:	c7 45 fc 00 00 00 00 	mov    DWORD PTR [ebp-0x4],0x0
  4f1856:	8b f0                	mov    esi,eax
  4f1858:	b8 00 00 00 00       	mov    eax,0x0
  4f185d:	85 f6                	test   esi,esi
  4f185f:	74 0c                	je     0x4f186d
  4f1861:	68 e8 5d 5d 00       	push   0x5d5de8
  4f1866:	8b ce                	mov    ecx,esi
  4f1868:	e8 93 7a f9 ff       	call   0x489300
  4f186d:	c7 45 fc ff ff ff ff 	mov    DWORD PTR [ebp-0x4],0xffffffff
  4f1874:	a3 6c ce 98 00       	mov    ds:0x98ce6c,eax
  4f1879:	85 c0                	test   eax,eax
  4f187b:	74 5c                	je     0x4f18d9
  4f187d:	83 7d 08 00          	cmp    DWORD PTR [ebp+0x8],0x0
  4f1881:	74 56                	je     0x4f18d9
  4f1883:	6a 00                	push   0x0
  4f1885:	8d 85 d0 fd ff ff    	lea    eax,[ebp-0x230]
  4f188b:	68 ec 99 59 00       	push   0x5999ec
  4f1890:	50                   	push   eax
  4f1891:	e8 4a e7 00 00       	call   0x4fffe0
  4f1896:	83 c4 0c             	add    esp,0xc
  4f1899:	8d 85 d0 fd ff ff    	lea    eax,[ebp-0x230]
  4f189f:	8d 8d e0 fe ff ff    	lea    ecx,[ebp-0x120]
  4f18a5:	50                   	push   eax
  4f18a6:	68 2c e0 5a 00       	push   0x5ae02c
  4f18ab:	51                   	push   ecx
  4f18ac:	e8 9f 9b 06 00       	call   0x55b450
  4f18b1:	83 c4 0c             	add    esp,0xc
  4f18b4:	8d 8d e0 fe ff ff    	lea    ecx,[ebp-0x120]
  4f18ba:	51                   	push   ecx
  4f18bb:	e8 c0 4b 03 00       	call   0x526480
  4f18c0:	83 c4 04             	add    esp,0x4
  4f18c3:	85 c0                	test   eax,eax
  4f18c5:	74 12                	je     0x4f18d9
  4f18c7:	8d 85 e0 fe ff ff    	lea    eax,[ebp-0x120]
  4f18cd:	8b 0d 6c ce 98 00    	mov    ecx,DWORD PTR ds:0x98ce6c
  4f18d3:	50                   	push   eax
  4f18d4:	e8 d7 76 f9 ff       	call   0x488fb0
  4f18d9:	8b 45 f4             	mov    eax,DWORD PTR [ebp-0xc]
  4f18dc:	5e                   	pop    esi
  4f18dd:	64 a3 00 00 00 00    	mov    fs:0x0,eax
  4f18e3:	8b e5                	mov    esp,ebp
  4f18e5:	5d                   	pop    ebp
  4f18e6:	c3                   	ret
