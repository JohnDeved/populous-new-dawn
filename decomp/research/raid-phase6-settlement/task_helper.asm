004d14f0 sub esp, 0x20
004d14f3 mov eax, 1
004d14f8 mov dword ptr [esp + 0x14], eax
004d14fc push ebx
004d14fd mov ebx, dword ptr [esp + 0x28]
004d1501 push esi
004d1502 mov dword ptr [esp + 0x24], eax
004d1506 push edi
004d1507 mov dword ptr [esp + 0x18], eax
004d150b push ebp
004d150c mov ebp, dword ptr [esp + 0x38]
004d1510 push ebx
004d1511 call 0x462750
004d1516 add esp, 4
004d1519 add dword ptr [ebp + 4], eax
004d151c mov esi, dword ptr [ebx + 0x881]
004d1522 test esi, esi
004d1524 je 0x4d18c3
004d152a mov eax, dword ptr [esp + 0x3c]
004d152e inc eax
004d152f push eax
004d1530 push esi
004d1531 call 0x4f2460
004d1536 add esp, 8
004d1539 test eax, eax
004d153b je 0x4d18b8
004d1541 mov dword ptr [esp + 0x2c], 0
004d1549 mov al, byte ptr [esi + 0x2c]
004d154c cmp al, 0x19
004d154e je 0x4d155a
004d1550 cmp al, 0x1d
004d1552 je 0x4d155a
004d1554 test byte ptr [esi + 0xe], 8
004d1558 je 0x4d1561
004d155a mov dword ptr [ebp + 4], 0x709
004d1561 cmp dword ptr [esp + 0x4c], 0
004d1566 je 0x4d1759
004d156c cmp byte ptr [ebp + 0x2f], 0xff
004d1570 je 0x4d1759
004d1576 cmp dword ptr [esp + 0x24], 0
004d157b je 0x4d15e9
004d157d test byte ptr [ebp + 8], 3
004d1581 jne 0x4d15e9
004d1583 mov edi, dword ptr [esp + 0x44]
004d1587 xor eax, eax
004d1589 mov ecx, 0xa
004d158e rep stosd dword ptr es:[edi], eax
004d1590 mov edi, dword ptr [esp + 0x40]
004d1594 mov ecx, 0xa
004d1599 rep stosd dword ptr es:[edi], eax
004d159b mov ax, word ptr [esi + 0x3d]
004d159f shr ax, 8
004d15a3 push 7
004d15a5 and al, 0xfe
004d15a7 push 0xa
004d15a9 mov ecx, dword ptr [esp + 0x48]
004d15ad mov byte ptr [esp + 0x1a], al
004d15b1 mov ax, word ptr [esi + 0x3f]
004d15b5 push ecx
004d15b6 shr ax, 8
004d15ba mov edx, dword ptr [esp + 0x50]
004d15be and al, 0xfe
004d15c0 push edx
004d15c1 mov byte ptr [esp + 0x23], al
004d15c5 mov eax, dword ptr [esp + 0x22]
004d15c9 push eax
004d15ca push ebx
004d15cb call 0x4f5950
004d15d0 mov ecx, dword ptr [esp + 0x5c]
004d15d4 add esp, 0x18
004d15d7 push ecx
004d15d8 push ebp
004d15d9 call 0x4f2e40
004d15de mov dword ptr [esp + 0x2c], 0
004d15e6 add esp, 8
004d15e9 cmp byte ptr [esi + 0x2b], 7
004d15ed jne 0x4d1759
004d15f3 push esi
004d15f4 lea eax, [ebp + 0x1f]
004d15f7 push eax
004d15f8 call 0x4f4f60
004d15fd add esp, 8
004d1600 mov edi, eax
004d1602 test edi, edi
004d1604 je 0x4d16ef
004d160a movsx eax, byte ptr [ebx + 0xc22]
004d1611 push eax
004d1612 push edi
004d1613 call 0x4c29a0
004d1618 add esp, 8
004d161b cmp eax, 3
004d161e je 0x4d163b
004d1620 mov ecx, edi
004d1622 mov eax, dword ptr [ebx + 0x94d]
004d1628 shl ecx, 6
004d162b sub ecx, edi
004d162d sub ecx, edi
004d162f cmp dword ptr [ecx + 0x5a80d4], eax
004d1635 jg 0x4d1759
004d163b push esi
004d163c call 0x4c2d80
004d1641 add esp, 4
004d1644 test eax, eax
004d1646 je 0x4d1759
004d164c test byte ptr [ebp + 8], 3
004d1650 jne 0x4d1759
004d1656 push edi
004d1657 push esi
004d1658 call 0x4f2100
004d165d add esp, 8
004d1660 test eax, eax
004d1662 je 0x4d1759
004d1668 mov ax, word ptr [esi + 0x3d]
004d166c shr ax, 8
004d1670 and al, 0xfe
004d1672 mov byte ptr [esp + 0x14], al
004d1676 mov ax, word ptr [esi + 0x3f]
004d167a shr ax, 8
004d167e and al, 0xfe
004d1680 mov byte ptr [esp + 0x15], al
004d1684 mov al, byte ptr [esi + 0x2c]
004d1687 cmp al, 0x19
004d1689 je 0x4d1695
004d168b cmp al, 0x1d
004d168d je 0x4d1695
004d168f mov ax, word ptr [ebp + 0x10]
004d1693 jmp 0x4d169a
004d1695 mov ax, word ptr [esp + 0x14]
004d169a mov word ptr [esp + 0x16], ax
004d169f push edi
004d16a0 mov eax, dword ptr [esp + 0x1a]
004d16a4 push eax
004d16a5 push esi
004d16a6 call 0x4f3040
004d16ab add esp, 0xc
004d16ae test eax, eax
004d16b0 je 0x4d1759
004d16b6 lea eax, [esp + 0x10]
004d16ba push 0
004d16bc mov ecx, dword ptr [esp + 0x1a]
004d16c0 push eax
004d16c1 push ecx
004d16c2 push edi
004d16c3 push ebx
004d16c4 call 0x4f4680
004d16c9 add esp, 0x14
004d16cc test eax, eax
004d16ce je 0x4d1759
004d16d4 mov eax, dword ptr [esp + 0x10]
004d16d8 push eax
004d16d9 push edi
004d16da push ebx
004d16db call 0x4f4de0
004d16e0 add esp, 0xc
004d16e3 lea eax, [ebp + 0x1f]
004d16e6 push edi
004d16e7 push eax
004d16e8 call 0x4f4ff0
004d16ed jmp 0x4d1756
004d16ef mov ecx, 1
004d16f4 xor edx, edx
004d16f6 xor eax, eax
004d16f8 cmp byte ptr [ebp + edx + 0x1f], al
004d16fc je 0x4d1700
004d16fe xor ecx, ecx
004d1700 inc edx
004d1701 cmp edx, 3
004d1704 jl 0x4d16f8
004d1706 test ecx, ecx
004d1708 je 0x4d1759
004d170a push ebx
004d170b call 0x4f6020
004d1710 mov word ptr [esp + 0x1e], ax
004d1715 add esp, 4
004d1718 and byte ptr [esp + 0x1a], 0xfe
004d171d movzx ax, byte ptr [esp + 0x1a]
004d1723 shl ax, 8
004d1727 lea ecx, [esp + 0x28]
004d172b and byte ptr [esp + 0x1b], 0xfe
004d1730 mov word ptr [esp + 0x28], ax
004d1735 push ecx
004d1736 movzx ax, byte ptr [esp + 0x1f]
004d173c shl ax, 8
004d1740 push esi
004d1741 mov word ptr [esp + 0x32], ax
004d1746 call 0x43b2a0
004d174b add esp, 8
004d174e push 0
004d1750 push esi
004d1751 call 0x4f2440
004d1756 add esp, 8
004d1759 push esi
004d175a call 0x4f39f0
004d175f add esp, 4
004d1762 test eax, eax
004d1764 je 0x4d1879
004d176a push 0
004d176c push esi
004d176d call 0x4f2440
004d1772 add esp, 8
004d1775 push esi
004d1776 call 0x436ca0
004d177b add esp, 4
004d177e push esi
004d177f call 0x4e9b40
004d1784 add esp, 4
004d1787 test byte ptr [esi + 0xe], 0x10
004d178b jne 0x4d17e0
004d178d mov al, byte ptr [esi + 0x2c]
004d1790 mov byte ptr [esi + 0x7d], al
004d1793 test byte ptr [0x89d17c], 2
004d179a je 0x4d17b1
004d179c mov cl, byte ptr [esi + 0x2b]
004d179f cmp cl, 7
004d17a2 jne 0x4d17ab
004d17a4 mov byte ptr [esp + 0x1c], 0x27
004d17a9 jmp 0x4d17c7
004d17ab xor eax, eax
004d17ad mov al, cl
004d17af jmp 0x4d17b6
004d17b1 xor eax, eax
004d17b3 mov al, byte ptr [esi + 0x2b]
004d17b6 lea ecx, [eax + eax*4]
004d17b9 lea edx, [ecx + ecx*4]
004d17bc mov al, byte ptr [edx*2 + 0x5a7064]
004d17c3 mov byte ptr [esp + 0x1c], al
004d17c7 push esi
004d17c8 call 0x4ed6f0
004d17cd mov al, byte ptr [esp + 0x20]
004d17d1 add esp, 4
004d17d4 mov byte ptr [esi + 0x2c], al
004d17d7 push esi
004d17d8 call 0x4ed640
004d17dd add esp, 4
004d17e0 mov eax, dword ptr [esi + 0x3d]
004d17e3 mov dword ptr [esp + 0x20], eax
004d17e7 mov byte ptr [esp + 0x18], ah
004d17eb mov cx, word ptr [esp + 0x22]
004d17f0 xor eax, eax
004d17f2 mov byte ptr [esp + 0x19], ch
004d17f6 xor ecx, ecx
004d17f8 mov ax, word ptr [esp + 0x18]
004d17fd mov cx, word ptr [esp + 0x18]
004d1802 and eax, 0xfe
004d1807 add eax, eax
004d1809 and ecx, 0xfe00
004d180f or eax, ecx
004d1811 lea ecx, [eax*4 + 0x8a03e4]
004d1818 test byte ptr [ecx + 1], 2
004d181c je 0x4d183e
004d181e lea eax, [esp + 0x20]
004d1822 push eax
004d1823 xor eax, eax
004d1825 mov ax, word ptr [ecx + 8]
004d1829 and eax, 0x3ff
004d182e mov ecx, dword ptr [eax*4 + 0x890390]
004d1835 push ecx
004d1836 call 0x4044b0
004d183b add esp, 8
004d183e mov eax, dword ptr [esp + 0x20]
004d1842 mov dword ptr [esi + 0x68], eax
004d1845 and ax, 0xfe00
004d1849 add ax, 0x100
004d184d mov word ptr [esi + 0x68], ax
004d1851 mov ax, word ptr [esi + 0x6a]
004d1855 and ax, 0xfe00
004d1859 add ax, 0x100
004d185d mov word ptr [esi + 0x6a], ax
004d1861 mov al, byte ptr [esi + 0x82]
004d1867 and al, 0xf0
004d1869 mov byte ptr [esi + 0x82], al
004d186f and al, 0xf
004d1871 mov byte ptr [esi + 0x82], al
004d1877 jmp 0x4d18a1
004d1879 mov cl, byte ptr [esi + 0x2c]
004d187c xor eax, eax
004d187e mov al, cl
004d1880 test byte ptr [eax + eax*4 + 0x5a6f79], 8
004d1888 jne 0x4d18a9
004d188a cmp cl, 0x19
004d188d je 0x4d18a9
004d188f cmp cl, 0x1d
004d1892 je 0x4d18a9
004d1894 push esi
004d1895 call 0x4df0e0
004d189a add esp, 4
004d189d test al, al
004d189f jne 0x4d18a9
004d18a1 mov dword ptr [esp + 0x1c], 0
004d18a9 cmp word ptr [esi + 0x5f], 0
004d18ae je 0x4d18b8
004d18b0 mov dword ptr [esp + 0x1c], 0
004d18b8 mov esi, dword ptr [esi + 8]
004d18bb test esi, esi
004d18bd jne 0x4d152a
004d18c3 cmp dword ptr [esp + 0x2c], 0
004d18c8 je 0x4d18ec
004d18ca push 0x33
004d18cc xor eax, eax
004d18ce mov ax, word ptr [ebp + 0x18]
004d18d2 push eax
004d18d3 push ebx
004d18d4 call 0x48c650
004d18d9 mov ecx, dword ptr [esp + 0x54]
004d18dd add esp, 0xc
004d18e0 mov word ptr [ebp + 0x42], cx
004d18e4 pop ebp
004d18e5 pop edi
004d18e6 pop esi
004d18e7 pop ebx
004d18e8 add esp, 0x20
004d18eb ret 
004d18ec cmp dword ptr [esp + 0x1c], 0
004d18f1 jne 0x4d18fc
004d18f3 cmp dword ptr [ebp + 4], 0x708
004d18fa jle 0x4d1904
004d18fc mov ax, word ptr [ebp + 0x44]
004d1900 mov word ptr [ebp + 0x42], ax
004d1904 pop ebp
004d1905 pop edi
004d1906 pop esi
004d1907 pop ebx
004d1908 add esp, 0x20
004d190b ret 
