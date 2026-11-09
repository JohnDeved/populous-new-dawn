; Original d3dpoptb.exe instruction bytes. Display-only header is normalized.
; Complete gate window 004b2670..004b2682 (end exclusive).
  4b2670:	83 3d f4 c2 af 00 00 	cmp    DWORD PTR ds:0xafc2f4,0x0
  4b2677:	75 03                	jne    0x4b267c
  4b2679:	33 c0                	xor    eax,eax
  4b267b:	c3                   	ret
  4b267c:	a1 40 dc 5c 00       	mov    eax,ds:0x5cdc40
  4b2681:	c3                   	ret
