# BỘ 100 CÂU HỎI PHỎNG VẤN CHUYÊN GIA - XÂY DỰNG KNOWLEDGE BASE (KPM)
*Được biên soạn chi tiết để làm dữ liệu nền tảng cho việc train AI (Intents, Patterns) và cấu hình Database gốc.*

**Mục tiêu:** 
- Khai thác dữ liệu thực tế để nhập liệu vào các bảng tính toán: `materials`, `material_thickness`, `paint_types`, `labor_rates`, `component_templates`.
- Tạo bộ dữ liệu khổng lồ để cấu hình `ai_knowledge_patterns` (tạo Intent/Kịch bản) và `ai_knowledge_base` (Kiến thức/Câu trả lời chuẩn).

---

## INTENT 1: CẤU TRÚC GIÁ VÀ KIẾN THỨC VẬT TƯ CHÍNH
*(Tác động: Bảng `materials`, `material_thickness`, `ai_knowledge_patterns`)*

1. Thép mạ kẽm và thép đen khác nhau như thế nào? Bảng giá chênh lệch (`base_price`) giữa 2 loại là bao nhiêu?
2. Khi nào bắt buộc phải tư vấn khách dùng mạ kẽm, khi nào có thể dùng thép đen để tiết kiệm chi phí?
3. Inox 201 và Inox 304 chênh nhau về giá ra sao? Hệ số giá (price_multiplier) là bao nhiêu?
4. Thực tế ngoài trời Inox 201 có bị rỉ không? Nếu khách nằng nặc đòi làm Inox 201 ngoài trời, AI phải phản hồi thế nào?
5. Độ dày sắt hộp phổ biến nhất để làm khung cổng 4 cánh là bao nhiêu ly để không bị yếu xệ?
6. Bảng quy đổi giá: Chênh lệch giá giữa sắt hộp 1.2 ly, 1.4 ly và 1.8 ly được tính theo hệ số nào?
7. Tôn lợp mái: 3 dem, 4 dem, 5 dem thường được ứng dụng cho những loại công trình nào tương ứng? Đơn giá m2 chênh nhau bao nhiêu?
8. Tôn xốp (tôn PU cách nhiệt) chống nóng hiệu quả thực tế giảm được khoảng bao nhiêu độ so với tôn thường? Giá đắt hơn bao nhiêu %?
9. Kính cường lực 8ly, 10ly, 12ly - cách tư vấn chọn độ dày kính cho cửa đi và lan can ban công?
10. Kính dán an toàn (kính ghép 6.38ly, 8.38ly) khác gì kính cường lực? Nên dùng ở vị trí nào? Chênh lệch giá kính cường lực và kính dán?
11. Cổng nhôm đúc nguyên khối có ưu/nhược điểm thực tế gì so với cổng sắt cắt CNC?
12. Sắt tấm cắt CNC nên dùng độ dày bao nhiêu ly để khi hàn vào khung không bị cong vênh lượn sóng? (Mức hao phí thép tấm tính thế nào?)
13. Sắt đặc uốn mỹ thuật và sắt hộp rỗng, nếu cùng kích thước thì độ chịu lực và đơn giá chênh nhau ra sao?
14. Gỗ nhựa composite dùng ốp cổng ngoài trời có thực sự bền không? Chịu nắng mưa được khoảng mấy năm thì bạc màu?
15. Lưới B40 bọc nhựa xanh và lưới B40 kẽm trần chênh lệch giá và tuổi thọ thực tế như thế nào?

---

## INTENT 2: KIẾN THỨC VẬT TƯ PHỤ, SƠN & PHỤ KIỆN
*(Tác động: Bảng `paint_types`, `component_templates`, `ai_knowledge_base`)*

16. Đơn giá cho 1m2 Sơn tĩnh điện so với Sơn Epoxy 2 thành phần và Sơn dầu thông thường hiện tại xưởng đang tính là bao nhiêu?
17. Sơn tĩnh điện có nhược điểm gì không? Nếu trong quá trình lắp đặt bị trầy xước thì AI tư vấn khách dặm vá lại kiểu gì cho tiệp màu?
18. Sự khác biệt cốt lõi về tuổi thọ giữa Sơn 2 thành phần (sơn Epoxy) và sơn dầu tổng hợp?
19. Quy trình sơn tay chuẩn (sơn lót, sơn phủ) cho một bộ cổng sắt ngoài trời để chống rỉ sét lâu nhất?
20. Định mức hao hụt sơn: Trung bình 1 ký (1 lít) sơn sắt thì phủ được khoảng bao nhiêu mét vuông bề mặt?
21. Bản lề cối tiện (xoay 360 độ) và bản lề lá - loại nào chịu lực tốt hơn cho cổng sắt nặng? Đơn giá phụ kiện chênh nhau bao nhiêu?
22. Ray chữ U (chạy bánh xe rãnh U) và Ray chữ V (rãnh V) - ưu và nhược điểm khi làm cổng lùa?
23. Khóa cửa cổng ngoài trời nên tư vấn khách xài loại nào để không bị kẹt rỉ sét do nước mưa? (Khóa tay gạt hay khóa thông minh?)
24. Motor cổng tự động âm sàn và loại cánh tay đòn: Chọn theo tiêu chí nào? Giá chênh nhau bao nhiêu?
25. Bánh xe cửa lùa nên chọn loại đúc bằng nhựa PA hay tiện bằng sắt nguyên khối? Tuổi thọ từng loại?
26. Keo Silicone Apollo A300 (keo trong) và A500 (keo màu) khác nhau về tính chất hóa học và công dụng thế nào?
27. Đá cắt và đá mài sắt (loại 1 tấc): Hãng nào xài êm tay và ít bị hao đá nhất hiện nay để xưởng kiểm soát chi phí?
28. Bột bả matit (trét vết hàn) dùng loại nào để phơi nắng mưa không bị nứt nẻ, bong tróc?
29. Que hàn Kim Tín: Làm sao thợ biết lúc nào nên dùng loại 2.5 ly, lúc nào dùng 3.2 ly? Tốc độ hao que hàn?
30. Công nghệ hàn dây (hàn Mig) có ưu điểm gì so với hàn que truyền thống (tốc độ, xỉ hàn)?

---

## INTENT 3: BÓC TÁCH KHỐI LƯỢNG & ĐỊNH MỨC TÍNH GIÁ
*(Tác động: Bảng `labor_rates`, rules báo giá trong `ai_knowledge_patterns`)*

31. Có mẹo hay công thức nhẩm nhanh nào để quy đổi từ diện tích mét vuông (m2) cửa ra số lượng cây sắt hộp cần mua không?
32. Tỷ lệ hao hụt (mạt cưa, đầu mẩu cắt bỏ) thường được tính an toàn cộng thêm bao nhiêu % vào tiền vật tư khi làm báo giá?
33. Cửa vòm cong phần đầu: Diện tích tính tiền m2 là tính theo hình chữ nhật bao quanh vòm hay tính diện tích thực tế?
34. Cổng sắt cắt CNC tính giá cho khách theo mét vuông (m2) hay bóc tách tính theo số kg thép tấm?
35. Đơn giá làm cửa sắt/cổng sắt thường đã bao gồm tiền phụ kiện (khóa, tay nắm) chưa hay tính thành một dòng riêng trong báo giá?
36. Đơn giá nhân công khoán (theo m2 hoặc theo kg) cho thợ hàn khoán hiện nay trên thị trường là bao nhiêu? (`labor_rates`)
37. Công trình ở xa xưởng (ví dụ đi tỉnh hoặc xa hơn 20km) thì tính phụ phí vận chuyển và ăn ở cho thợ như thế nào? (Tính theo km hay tính giá vo?)
38. Nếu thi công ở chung cư, tòa nhà cấm hàn xì gây ồn, phải vặn ốc hoàn toàn thì đơn giá nhân công đội lên bao nhiêu %?
39. Cửa xếp trượt nhiều cánh gia công và lắp đặt khó hơn cửa mở quay bao nhiêu? Đơn giá nhân công (labor_rates) nhân lên mấy lần?
40. Trường hợp khách chỉ mang bản vẽ đến xưởng nhờ gia công (khách tự chở về, tự lắp đặt) thì trừ đi bao nhiêu % tiền trong tổng báo giá?
41. Khi giá sắt thép trên thị trường đột ngột tăng mạnh, làm sao báo giá lại cho khách đang tư vấn dở dang mà không mất khách?
42. Cách đo và tính m2 lợp mái tôn: Tính theo diện tích mặt nghiêng của mái hay diện tích mặt bằng sàn nhà?
43. Sắt vụn (phế liệu) sinh ra trong quá trình làm cửa bán lại thường thu hồi bù đắp được khoảng bao nhiêu % tiền vật tư ban đầu?
44. Quy tắc nhận tiền cọc của xưởng: Ký hợp đồng thu bao nhiêu %? Khi nào thu tiếp? Khi nào thu phần còn lại?
45. Chi phí thuê xe cẩu (đối với các cổng sắt quá khổ) sẽ được tính gộp vào báo giá ngay từ đầu hay thông báo phụ thu sau?

---

## INTENT 4: KỸ THUẬT GIA CÔNG, SẢN XUẤT & THI CÔNG LẮP ĐẶT
*(Tác động: Bảng `component_templates`, `ai_knowledge_base`)*

46. Kỹ thuật hàn sắt hộp mỏng (1.0 ly - 1.2 ly): Chỉnh dòng điện máy hàn bao nhiêu và bóp cò thế nào để không bị thủng?
47. Cách cắt góc và ghép góc 90 độ của sắt hộp sao cho khít, khi hàn mài xong không bị lõm móp?
48. Khi hàn ghép tấm tôn mỏng dập lỗ vào khung sắt hộp, làm sao để tôn không bị co rút lượn sóng do nhiệt độ cao?
49. Quy trình xử lý mối hàn chuẩn: Từ lúc hàn xong dùng đá mài thô, đá nhám xếp, rồi bả matit ra sao để ra thành phẩm láng mịn?
50. Sau khi trét bột matit lên vết hàn, phải phơi nắng/đợi bao lâu mới được chà nhám nước và xịt sơn lót?
51. Tại sao trước khi sơn lót bắt buộc phải dùng khăn tẩm xăng lau sạch bề mặt sắt mạ kẽm?
52. Kinh nghiệm dựng trụ cổng sắt 4 cánh siêu nặng: Đào hố chôn bản lề cối trước hay dựng khung cổng lên hàn chết mới đổ bê tông?
53. Dùng cân thủy (thước nivo) hay máy tia laser để lấy thăng bằng trụ cổng chuẩn nhất, tránh tình trạng tự trôi cánh cửa?
54. Khi làm cửa sắt gắn kính: Kính được cố định vào khung sắt bằng cách bơm keo silicone hay dùng nẹp sắt chỉ? Mức độ hao hụt keo silicone tính thế nào?
55. Lợp mái tôn chống dột: Tôn úp gối mí lên nhau mấy sóng là chuẩn nhất (1 sóng hay 2 sóng rưỡi)?
56. Bắn vít tôn mái: Bắt vít dập nổi lên đỉnh sóng hay bắt chìm xuống lòng sóng nước để chống dột?
57. Cách tính nhẩm chia bậc cầu thang sắt xương cá: Lấy chiều cao tầng chia cho chiều cao bậc (15-18cm) sao cho bậc không bị quá cao hoặc quá thấp?
58. Các chi tiết sắt uốn mỹ thuật (hoa văn) ở xưởng là dùng thợ uốn tay (uốn đe) nguội, uốn hơ lửa, hay xài máy uốn thủy lực?
59. Chống thấm cho mái che giếng trời kính cường lực: Dùng loại keo nào tốt nhất và cách dán mí tiếp giáp với tường để nước mưa không chảy ngược vào?
60. Lấy số đo chừa lỗ ban làm cửa: Số đo "lọt lòng gió (sáng)" khác với số đo "phủ bì (bao gồm khung bao)" như thế nào? Cách giải thích cho khách khi khách thắc mắc?

---

## INTENT 5: TÂM LÝ KHÁCH HÀNG & KỊCH BẢN CHỐT SALE (UP-SALE / HANDLE OBJECTION)
*(Tác động: `trigger_keywords` & `response_structure` trong bảng `ai_knowledge_patterns`)*

61. Xử lý từ chối (Gặp nhiều nhất): Khi khách chê "Giá bên kia báo tôi rẻ hơn nhà anh 200 ngàn/m2", AI phải dùng kịch bản giải thích nào thuyết phục nhất?
62. Tư vấn Up-sale 1: Làm sao để AI thuyết phục khách bỏ thêm tiền làm sơn tĩnh điện thay vì sơn thường?
63. Tư vấn Up-sale 2: Làm sao để AI khuyên khách dùng sắt hộp dày hơn (ví dụ 1.4ly thay vì 1.2ly) so với dự định ban đầu của khách?
64. Tư vấn Công năng: Nhà phố mặt tiền hẹp, dốc vỉa hè cao thì khuyên khách làm cổng lùa ngang, cổng mở quay vào trong hay cổng xếp 4 cánh? Tại sao?
65. Tư vấn Thẩm mỹ: Chủ nhà thích cổng bịt kín bưng nhưng ban quản lý khu dân cư quy định hàng rào phải hở 50%, thì tư vấn giải pháp mẫu mã nào?
66. Cam kết rỉ sét: Khách lo lắng hỏi "Sắt mạ kẽm làm cổng để ngoài mưa nắng như vậy bao lâu thì bị rỉ sét?", AI sẽ trả lời và cam kết như thế nào?
67. Xử lý rủi ro đổi ý: Khách hay đổi ý sửa thiết kế ngang xương khi xưởng đã cắt sắt xong khung, làm sao để rào trước việc này trong tin nhắn hợp đồng?
68. Phân loại khách hàng: Có dấu hiệu (từ khóa) nào từ khách chat giúp AI nhận biết nhanh một khách hàng chỉ tới hỏi dò giá để ép giá xưởng khác, chứ không có ý định làm thực sự?
69. Tư vấn cửa nhà trọ: Làm cửa sắt thoát hiểm cho dãy trọ đông người cần lưu ý quy định PCCC nào (như khóa mở từ bên trong không cần chìa)?
70. Tư vấn Phong thủy: Có những con số kích thước lỗ ban (thước đỏ) nào bắt buộc phải nhớ khi đo chiều rộng cửa đi, cửa sổ? 
71. Tư vấn cầu thang: Cách tính số bậc cầu thang Sinh-Lão-Bệnh-Tử để tư vấn cho khách hàng tin phong thủy?
72. Xử lý e ngại về Ray nổi: Khách sợ cổng lùa chạy ray nổi dưới đất đi xe máy hay vấp, giải thích cơ cấu ray âm hoặc ray V nổi vát cạnh như thế nào?
73. Khách không hiểu vật liệu: Khách đòi làm cửa Inox 304 nguyên khối nhưng bắt phải sơn màu giả gỗ (sơn trên inox bám rất kém), AI sẽ giải thích và đổi hướng tư vấn ra sao?
74. Báo giá vo vs Báo giá bóc tách: Khách hàng nào thì AI nên in ra Báo giá vo trọn gói, khách hàng nào thì AI nên in ra báo giá bóc tách từng chi tiết (vật tư, nhân công, phụ kiện)?
75. Pháp lý thi công: Trong hợp đồng thi công nhà dân, điều khoản nào bắt buộc phải có để xưởng không bị thiệt thòi khi nghiệm thu hoặc lúc khách chây ì tiền cuối?

---

## INTENT 6: BẢO HÀNH, SỬA CHỮA & CÁC LỖI THƯỜNG GẶP (MAINTENANCE & WARRANTY)
*(Tác động: Các FAQ tự động trả lời khách hàng trong `ai_knowledge_patterns`)*

76. Xệ bản lề: Cổng sắt 4 cánh sau 1 năm sử dụng bị xệ cánh cạ xuống nền gạch: Nguyên nhân chính là gì và cách tư vấn khách khắc phục tạm thời?
77. Kẹt ray cửa lùa: Cửa lùa đẩy bị rít, kẹt cứng kêu rột rẹt: Nguyên nhân do bạc đạn bánh xe bể hay do rác lọt vào rãnh ray? Xử lý thế nào?
78. Xước sơn tĩnh điện: Lớp sơn tĩnh điện bị va quẹt vật cứng xước thành vệt dài tới lõi thép. AI tư vấn khách tự dùng sơn xịt ATM dặm lại như thế nào cho chuẩn?
79. Kẹt khóa cổng ngoài trời: Khóa cửa cổng tay gạt ngoài trời bị kẹt chốt cứng ngắc do mưa. Chỉ cần xịt RP7 vào lỗ khóa hay bắt buộc phải tháo ra thay ổ ruột mới?
80. Lỗi đọng nước rỉ sét từ trong: Nước mưa lọt vào bụng sắt hộp gây rỉ sét từ trong phá ra ngoài màng sơn, cách khoan lỗ thoát nước ở gầm mép cửa như thế nào?
81. Keo silicone lão hóa: Keo dán kính mái che sau 3 năm phơi nắng bị lão hóa, nứt nẻ làm dột nước. Quy trình cạo bỏ lớp keo cũ và bắn lớp keo mới?
82. Kêu to ở cửa kéo: Cửa kéo Đài Loan dập lá kẽm kéo ra vô kêu tiếng vang quá to. Dùng mỡ bò hay dầu nhớt bôi vào vị trí nào của ray và u để êm hơn?
83. Cháy sơn khi thay bản lề: Bản lề cổng sắt bị mòn cốt bi bên trong, khi thợ cắt bỏ bản lề cũ hàn bản lề mới làm sao để không cháy hỏng mảng sơn cửa xung quanh?
84. Hư Motor cửa tự động: Motor cổng tự động âm sàn bấm remote không chạy. AI hướng dẫn khách tự kiểm tra nhanh bo mạch, tụ điện hay công tắc hành trình qua điện thoại như thế nào?
85. Kính tự nổ: Hiện tượng kính cường lực tự nổ vỡ vụn dù không ai đập là do đâu? Ca này xưởng có chịu trách nhiệm bảo hành thay mới không? (Rule bảo hành)
86. Dột mái tôn lợp vít: Mái tôn chống nóng bị dột lỗ đinh vít lợp phơi sương. Khắc phục bằng cách bắn dặm keo silicone bọc đầu vít hay xài màng dán chống dột?
87. Cổng nhựa gỗ phai màu: Cổng ốp gỗ nhựa composite bị xước và bạc phếch màu do tia UV. AI tư vấn vật liệu này có thể chà nhám xịt phủ lớp sơn bóng PU lên lại được không?
88. Từ chối bảo hành: Các trường hợp nào do lỗi khách quan (chó mèo đi bậy làm rỉ chân cổng, tự ý đục phá) mà AI phải kiên quyết thông báo từ chối bảo hành miễn phí?
89. Sửa vặt cho khách quen: Khách quen gọi nhờ đến hàn lại cái bát khóa, mài lại cái chốt cửa (làm mất nửa buổi sáng thợ). Theo luật của xưởng, AI báo khách có tính tiền công đi lại không?
90. Tiêu chuẩn tuổi thọ: Tuổi thọ trung bình của một bộ cổng sắt mạ kẽm sơn lót kỹ để ngoài trời mưa nắng là khoảng bao nhiêu năm thì mới bắt đầu có dấu hiệu xuống cấp cần bảo dưỡng lớn?

---

## INTENT 7: QUẢN LÝ XƯỞNG, THỢ THUYỀN & AN TOÀN LAO ĐỘNG
*(Tác động: Tài liệu Training nội bộ trong `ai_knowledge_base`)*

91. Tuyển và đào tạo thợ: Một người thợ phụ mới vào nghề làm việc vặt thì mất trung bình bao lâu học nghề mới lên được thợ chính tự tin cầm kiềm hàn ra khung cửa?
92. Sơ cứu Bệnh nghề nghiệp: Thợ hàn bị đau mắt hàn (tối ngủ mắt nhức buốt chảy nước mắt như xát muối), mẹo dân gian hoặc thuốc nhỏ mắt nào xưởng hay dùng để trị nhanh nhất?
93. Tối ưu nhân sự: Xưởng đông thợ thì chia việc kiểu dây chuyền (tổ chuyên cắt, tổ chuyên hàn ráp, tổ chuyên mài sơn, tổ chuyên đi lắp đặt) hay giao 1 người làm từ A-Z một sản phẩm thì năng suất cao hơn?
94. Giám sát hao hụt sắt: Cách quản lý và giám sát thợ cắt sắt để thợ không cắt sai kích thước phạm vào thân cây sắt dài (gây lãng phí phải vứt đi làm phế liệu)?
95. An toàn PCCC xưởng: Khu vực để que hàn, máy móc phát tia lửa điện và khu vực để thùng sơn lót, xăng thơm phải bố trí cách nhau ra sao để phòng chống cháy nổ?
96. Bảo dưỡng máy móc: Máy hàn điện tử, máy cắt bàn, máy hơi hút bụi mạt sắt vào trong suốt ngày, chế độ xịt bụi bảo dưỡng định kỳ bao lâu để không bị chập cháy dây đồng?
97. Thi công trên cao: Quy định bắt buộc nào của xưởng về giàn giáo, móc dây đai an toàn thợ đu ròng rọc khi đi lắp đặt lan can ban công mặt tiền, mái kính giếng trời?
98. Khích lệ OT (Over-time): Mùa cao điểm cận Tết, xưởng tính toán chia thưởng năng suất hoặc tiền tăng ca buổi tối như thế nào để thợ chịu cày ép tiến độ kịp giao công trình?
99. Quản lý rủi ro hiện trường: Khi thợ đi lắp đặt lỡ tay làm vỡ gạch ốp tường, vỡ kính chậu rửa của chủ nhà thì chủ xưởng có luật đền bù như thế nào cho êm chuyện?
100. Tầm nhìn kinh doanh: Trong vòng 5-10 năm tới, khi các loại máy móc tự động hóa, cắt laser CNC ngày càng rẻ đi, thì xưởng cơ khí hàn uốn thủ công truyền thống cần thay đổi mô hình nào để không bị đào thải? Lợi thế cạnh tranh nào nên giữ lại?

---

## INTENT 8: TÍNH TOÁN BÁO GIÁ SƠ BỘ THEO KÍCH THƯỚC (GIA CÔNG THEO YÊU CẦU)
*(Tác động: Bảng `ai_knowledge_base` và Kịch bản RAG khi khách cung cấp Chiều Ngang / Chiều Cao)*

101. Khi khách hàng hỏi về một mặt hàng gia công (như hàng rào, mái che, lan can) và cung cấp cụ thể kích thước (ví dụ: "nhà 3m ngang và 2m dài"), quy trình tính toán Diện Tích (m2) và kết hợp Đơn giá Vật tư + Đơn giá Nhân công để đưa ra Khoảng giá dự toán tham khảo sẽ diễn ra như thế nào để khách không bị hụt hẫng vì "không tìm thấy sản phẩm đóng gói sẵn"? 

---
*Bằng cách phân loại rõ ràng theo 8 nhóm Intent này, sau khi chuyên gia điền xong đáp án, chúng ta có thể nạp thẳng trực tiếp vào Schema Database (nhóm nào vào bảng `materials`, nhóm nào vào `ai_knowledge_patterns`) rất trơn tru.*
