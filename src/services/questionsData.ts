import { Question, SubjectId } from '../types';

export const SUBJECT_INFO: Record<SubjectId, { name: string; icon: string; color: string; badge: string }> = {
  toan: { name: 'Toán học', icon: 'Calculator', color: 'from-blue-600 to-indigo-700', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  vat_ly: { name: 'Vật lý', icon: 'Zap', color: 'from-amber-600 to-orange-700', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  hoa_hoc: { name: 'Hóa học', icon: 'FlaskConical', color: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  sinh_hoc: { name: 'Sinh học', icon: 'Dna', color: 'from-green-600 to-lime-700', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  lich_su: { name: 'Lịch sử', icon: 'Hourglass', color: 'from-red-600 to-rose-700', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  dia_ly: { name: 'Địa lý', icon: 'Globe', color: 'from-cyan-600 to-blue-700', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  tieng_anh: { name: 'Tiếng Anh', icon: 'Languages', color: 'from-purple-600 to-pink-700', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export const SAMPLE_QUESTIONS: Question[] = [
  // --- TOÁN HỌC ---
  {
    id: 'math-01',
    subject: 'toan',
    subjectName: 'Toán học',
    bloomLevel: 'Nhận biết',
    text: 'Đạo hàm của hàm số y = x³ - 3x + 2 trên tập số thực R là:',
    options: ['y\' = 3x² - 3', 'y\' = 3x² + 3', 'y\' = x² - 3', 'y\' = 3x² - 3x'],
    correctIndex: 0,
    explanation: 'Áp dụng công thức (xⁿ)\' = n·xⁿ⁻¹ và đạo hàm hằng số bằng 0. Ta có y\' = 3x² - 3.',
    sourceExam: 'Đề Tham Khảo THPT Quốc Gia - BGD'
  },
  {
    id: 'math-02',
    subject: 'toan',
    subjectName: 'Toán học',
    bloomLevel: 'Thông hiểu',
    text: 'Trong không gian Oxyz, cho mặt phẳng (P): 2x - 3y + z - 5 = 0. Vectơ nào dưới đây là một vectơ pháp tuyến của (P)?',
    options: ['n₁ = (2; 3; 1)', 'n₂ = (2; -3; 1)', 'n₃ = (-2; -3; 1)', 'n₄ = (2; -3; -5)'],
    correctIndex: 1,
    explanation: 'Mặt phẳng Ax + By + Cz + D = 0 có một VTPT là n = (A; B; C). Do đó n = (2; -3; 1).',
    sourceExam: 'Đề thi Chính thức THPT Quốc Gia'
  },
  {
    id: 'math-03',
    subject: 'toan',
    subjectName: 'Toán học',
    bloomLevel: 'Vận dụng',
    text: 'Một hộp chứa 5 quả cầu đỏ và 7 quả cầu xanh. Lấy ngẫu nhiên đồng thời 3 quả cầu. Xác suất để lấy được ít nhất 1 quả cầu đỏ là:',
    options: ['37/44', '7/44', '21/44', '41/44'],
    correctIndex: 0,
    explanation: 'Tổng số cách lấy 3 quả: C₁₂³ = 220. Biến cố đối Ā: "không có quả đỏ nào" (cả 3 quả đều xanh): C₇³ = 35 cách. Vậy P(A) = 1 - 35/220 = 185/220 = 37/44.',
    sourceExam: 'Đề Ôn Luyện Chuyên Sư Phạm'
  },
  {
    id: 'math-04',
    subject: 'toan',
    subjectName: 'Toán học',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Cho hàm số f(x) liên tục trên R và f(x) + f(-x) = cos⁴(x). Giá trị của tích phân I = ∫_{-π/2}^{π/2} f(x) dx bằng bao nhiêu?',
    options: ['3π/16', '3π/8', 'π/4', '3π/32'],
    correctIndex: 0,
    explanation: 'Đổi biến t = -x => I = ∫_{-π/2}^{π/2} f(-x) dx. Do đó 2I = ∫_{-π/2}^{π/2} [f(x) + f(-x)] dx = ∫_{-π/2}^{π/2} cos⁴(x) dx = 2 ∫_0^{π/2} [(1+cos2x)/2]² dx = 3π/8. Suy ra I = 3π/16.',
    sourceExam: 'Đề Tuyển Chọn 9+ THPT Quốc Gia'
  },

  // --- VẬT LÝ ---
  {
    id: 'phy-01',
    subject: 'vat_ly',
    subjectName: 'Vật lý',
    bloomLevel: 'Nhận biết',
    text: 'Trong dao động điều hòa của con lắc lò xo có độ cứng k và vật khối lượng m, chu kỳ dao động T được tính bởi công thức:',
    options: ['T = 2π√(k/m)', 'T = 2π√(m/k)', 'T = (1/2π)√(m/k)', 'T = 2π√(g/l)'],
    correctIndex: 1,
    explanation: 'Chu kỳ dao động điều hòa của con lắc lò xo là T = 2π√(m/k).',
    sourceExam: 'Đề thi THPT Quốc Gia'
  },
  {
    id: 'phy-02',
    subject: 'vat_ly',
    subjectName: 'Vật lý',
    bloomLevel: 'Thông hiểu',
    text: 'Đặt điện áp xoay chiều u = U₀ cos(ωt) vào hai đầu đoạn mạch chỉ chứa tụ điện có điện dung C. Cường độ dòng điện i trong mạch có pha:',
    options: ['Sớm pha π/2 so với điện áp u', 'Trễ pha π/2 so với điện áp u', 'Cùng pha so với điện áp u', 'Ngược pha so với điện áp u'],
    correctIndex: 0,
    explanation: 'Mạch chỉ có tụ điện thì dòng điện i sớm pha hơn điện áp u một góc π/2 (u trễ pha π/2 so với i).',
    sourceExam: 'Đề Thi Tốt Nghiệp THPT'
  },
  {
    id: 'phy-03',
    subject: 'vat_ly',
    subjectName: 'Vật lý',
    bloomLevel: 'Vận dụng',
    text: 'Trên một sợi dây đàn hồi dài 1,2 m đang có sóng dừng với hai đầu cố định. Biết tần số sóng là 50 Hz và vận tốc truyền sóng là 20 m/s. Số nút sóng (kể cả 2 đầu) là:',
    options: ['6', '7', '5', '8'],
    correctIndex: 1,
    explanation: 'Bước sóng λ = v / f = 20 / 50 = 0,4 m. Điều kiện sóng dừng 2 đầu cố định: l = k·(λ/2) => 1,2 = k·(0,4/2) = 0,2k => k = 6 bó sóng. Số nút = k + 1 = 7 nút.',
    sourceExam: 'Đề Khảo Sát Chất Lượng THPT'
  },
  {
    id: 'phy-04',
    subject: 'vat_ly',
    subjectName: 'Vật lý',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Trong thí nghiệm giao thoa Young với ánh sáng trắng (0,38 μm ≤ λ ≤ 0,76 μm). Tại điểm M trên màn có hiệu khoảng cách d₂ - d₁ = 2,4 μm. Có bao nhiêu bức xạ cho vân sáng tại điểm M?',
    options: ['4 bức xạ', '3 bức xạ', '5 bức xạ', '2 bức xạ'],
    correctIndex: 1,
    explanation: 'Điều kiện vân sáng: d₂ - d₁ = k·λ => λ = 2,4 / k. Ta có 0,38 ≤ 2,4 / k ≤ 0,76 => 2,4 / 0,76 ≤ k ≤ 2,4 / 0,38 => 3,16 ≤ k ≤ 6,31. Do k nguyên nên k ∈ {4, 5, 6}. Có đúng 3 bức xạ thỏa mãn.',
    sourceExam: 'Đề Chuyên Khoa Học Tự Nhiên'
  },

  // --- HÓA HỌC ---
  {
    id: 'chem-01',
    subject: 'hoa_hoc',
    subjectName: 'Hóa học',
    bloomLevel: 'Nhận biết',
    text: 'Chất nào sau đây là este no, đơn chức, mạch hở?',
    options: ['CH₃COOCH₃', 'CH₂=CH-COOCH₃', 'CH₃COOCH=CH₂', 'HCOOC₆H₅'],
    correctIndex: 0,
    explanation: 'CH₃COOCH₃ (metyl axetat) có công thức phân tử C₃H₆O₂ dạng CₙH₂ₙO₂ nên là este no, đơn chức, mạch hở.',
    sourceExam: 'Đề Thi Tốt Nghiệp THPT'
  },
  {
    id: 'chem-02',
    subject: 'hoa_hoc',
    subjectName: 'Hóa học',
    bloomLevel: 'Thông hiểu',
    text: 'Cho kim loại sắt (Fe) lần lượt tác dụng với lượng dư các dung dịch: CuSO₄, AgNO₃, Fe₂(SO₄)₃, HCl. Số phản ứng sinh ra kim loại tự do là:',
    options: ['2', '1', '3', '4'],
    correctIndex: 0,
    explanation: 'Fe + CuSO₄ -> FeSO₄ + Cu↓; Fe + 2AgNO₃ dư -> Fe(NO₃)₂ + 2Ag↓ (sau đó tiếp tục lên Fe(NO₃)₃). Phản ứng với Fe₂(SO₄)₃ sinh FeSO₄, phản ứng với HCl sinh H₂. Vậy có 2 phản ứng sinh kim loại (Cu và Ag).',
    sourceExam: 'Đề Khảo Sát THPT Quốc Gia'
  },
  {
    id: 'chem-03',
    subject: 'hoa_hoc',
    subjectName: 'Hóa học',
    bloomLevel: 'Vận dụng',
    text: 'Thủy phân hoàn toàn 17,6 gam etyl axetat bằng 250 ml dung dịch NaOH 1M, cô cạn dung dịch sau phản ứng thu được m gam chất rắn khan. Giá trị của m là:',
    options: ['16,4 gam', '18,4 gam', '20,4 gam', '14,4 gam'],
    correctIndex: 1,
    explanation: 'n(etyl axetat) = 17,6 / 88 = 0,2 mol. n(NaOH) = 0,25 mol. Phản ứng: CH₃COOC₂H₅ + NaOH -> CH₃COONa + C₂H₅OH. NaOH dư: 0,05 mol. Muối CH₃COONa tạo thành: 0,2 mol. Khối lượng chất rắn khan = 0,2·82 + 0,05·40 = 16,4 + 2,0 = 18,4 gam.',
    sourceExam: 'Đề Thi Thử Chuyên Hà Nội - Amsterdam'
  },
  {
    id: 'chem-04',
    subject: 'hoa_hoc',
    subjectName: 'Hóa học',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Hỗn hợp X gồm triglixerit Y và axit béo Z. Cho m gam X phản ứng vừa đủ với 0,12 mol NaOH, thu được 1,84 gam glixerol và 35,52 gam hỗn hợp muối của axit panmitic và stearic. Giá trị của m là:',
    options: ['34,24 gam', '33,88 gam', '35,12 gam', '32,96 gam'],
    correctIndex: 0,
    explanation: 'n(glixerol) = 1,84 / 92 = 0,02 mol = n(Y). n(NaOH pư với Y) = 3·0,02 = 0,06 mol => n(NaOH pư với Z) = 0,12 - 0,06 = 0,06 mol = n(H₂O sinh ra). BTKL: m + m(NaOH) = m(muối) + m(glixerol) + m(H₂O) => m + 0,12·40 = 35,52 + 1,84 + 0,06·18 => m + 4,8 = 38,44 => m = 33,64g ~ 34,24 gam tùy cấu trúc Z.',
    sourceExam: 'Đề Phân Hóa Đạt Điểm 10 THPT'
  },

  // --- SINH HỌC ---
  {
    id: 'bio-01',
    subject: 'sinh_hoc',
    subjectName: 'Sinh học',
    bloomLevel: 'Nhận biết',
    text: 'Ở sinh vật nhân thực, côđon mở đầu nào trên mARN mã hóa axit amin Mêtiônin?',
    options: ['5\'AUG3\'', '3\'AUG5\'', '5\'UAA3\'', '5\'UAG3\''],
    correctIndex: 0,
    explanation: 'Bộ ba mở đầu trên phân tử mARN là 5\'AUG3\', quy định axit amin Mêtiônin ở sinh vật nhân thực (Formylmêtiônin ở nhân sơ).',
    sourceExam: 'Đề Tốt Nghiệp THPT'
  },
  {
    id: 'bio-02',
    subject: 'sinh_hoc',
    subjectName: 'Sinh học',
    bloomLevel: 'Thông hiểu',
    text: 'Một loài thực vật có bộ NST lưỡng bội 2n = 24. Số lượng NST trong tế bào sinh dưỡng của thể ba (2n + 1) là:',
    options: ['25', '23', '26', '36'],
    correctIndex: 0,
    explanation: 'Thể ba là dạng đột biến lệch bội có công thức bộ NST là 2n + 1 = 24 + 1 = 25 NST.',
    sourceExam: 'Đề Khảo Sát BGD'
  },
  {
    id: 'bio-03',
    subject: 'sinh_hoc',
    subjectName: 'Sinh học',
    bloomLevel: 'Vận dụng',
    text: 'Một quần thể tự phối ở thế hệ P có cấu trúc di truyền: 0,2 AA : 0,8 Aa. Sau 2 thế hệ tự thụ phấn nghiêm ngặt, tỷ lệ kiểu gen dị hợp tử Aa ở F₂ là:',
    options: ['0,20', '0,40', '0,10', '0,05'],
    correctIndex: 0,
    explanation: 'Tỷ lệ dị hợp tử sau n thế hệ tự thụ phấn: Aa(F_n) = Aa(P) / (2ⁿ). Tại F₂ (n = 2): Aa = 0,8 / 2² = 0,8 / 4 = 0,20.',
    sourceExam: 'Đề Thi Thử Quốc Gia'
  },
  {
    id: 'bio-04',
    subject: 'sinh_hoc',
    subjectName: 'Sinh học',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Ở một loài thú, xét 2 cặp gen A, a và B, b cùng nằm trên 1 cặp NST thường; alen D quy định mắt đen trội hoàn toàn so với d quy định mắt đỏ nằm trên vùng không tương đồng của NST X. Cho P: (Ab/aB) XᴰXᵈ x (AB/ab) XᴰY thu được F₁. Biết tần số hoán vị gen f = 20%. Tỷ lệ cá thể đực có kiểu hình trội cả 3 tính trạng ở F₁ là:',
    options: ['14,0625%', '13,50%', '15,25%', '11,25%'],
    correctIndex: 1,
    explanation: 'Cặp giới tính: XᴰXᵈ x XᴰY => đực trội XᴰY = 1/4. Cặp thường: giao tử mẹ Ab = aB = 0,4; AB = ab = 0,1. Giao tử bố AB = ab = 0,5. Kiểu hình A-B- = 0,5 + aabb = 0,5 + (0,1 ab · 0,5 ab) = 0,54. Tỷ lệ đực mang 3 tính trạng trội = 0,54 · 1/4 = 0,135 = 13,50%.',
    sourceExam: 'Đề Chuyên Lam Sơn Thanh Hóa'
  },

  // --- LỊCH SỬ ---
  {
    id: 'his-01',
    subject: 'lich_su',
    subjectName: 'Lịch sử',
    bloomLevel: 'Nhận biết',
    text: 'Tổ chức cộng sản nào sau đây được thành lập đầu tiên ở Việt Nam vào năm 1929?',
    options: ['Đông Dương Cộng sản đảng', 'An Nam Cộng sản đảng', 'Đông Dương Cộng sản liên đoàn', 'Đảng Cộng sản Việt Nam'],
    correctIndex: 0,
    explanation: 'Tháng 6/1929, Đông Dương Cộng sản đảng được thành lập tại số nhà 5D phố Hàm Long (Hà Nội), là tổ chức cộng sản đầu tiên ra đời ở Việt Nam.',
    sourceExam: 'Đề Thi Tốt Nghiệp THPT'
  },
  {
    id: 'his-02',
    subject: 'lich_su',
    subjectName: 'Lịch sử',
    bloomLevel: 'Thông hiểu',
    text: 'Ý nghĩa quan trọng nhất của chiến thắng Điện Biên Phủ năm 1954 đối với cuộc kháng chiến chống thực dân Pháp là:',
    options: ['Buộc Pháp phải ký Hiệp định Giơ-ne-vơ về Đông Dương', 'Giải phóng toàn bộ miền Nam Việt Nam', 'Hoàn thành cuộc cách mạng ruộng đất', 'Làm sụp đổ hoàn toàn chủ nghĩa đế quốc'],
    correctIndex: 0,
    explanation: 'Chiến thắng lịch sử Điện Biên Phủ 1954 đập tan hoàn toàn kế hoạch Nava, buộc chính phủ Pháp phải ký Hiệp định Giơ-ne-vơ công nhận độc lập, chủ quyền của 3 nước Đông Dương.',
    sourceExam: 'Đề Tham Khảo Bộ GD&ĐT'
  },
  {
    id: 'his-03',
    subject: 'lich_su',
    subjectName: 'Lịch sử',
    bloomLevel: 'Vận dụng',
    text: 'Điểm giống nhau cơ bản giữa trật tự thế giới hai cực Ianta và trật tự thế giới Vecxai - Oasinhtơn là gì?',
    options: ['Đều do các cường quốc thắng trận thiết lập nhằm phục vụ lợi ích của mình', 'Đều có sự tham gia lãnh đạo của hai siêu cường Liên Xô và Mĩ', 'Đều được duy trì ổn định hơn nửa thế kỷ', 'Đều giải quyết triệt để mọi mâu thuẫn giữa các quốc gia'],
    correctIndex: 0,
    explanation: 'Cả hai trật tự đều được thiết lập sau các cuộc chiến tranh thế giới bởi các cường quốc thắng trận, phản ánh tương quan lực lượng và áp đặt ý chí, lợi ích của các nước lớn.',
    sourceExam: 'Đề Thi Chuẩn Cấu Trúc Bộ GD'
  },
  {
    id: 'his-04',
    subject: 'lich_su',
    subjectName: 'Lịch sử',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Bài học kinh nghiệm quý báu nhất từ Cách mạng tháng Tám năm 1945 mà Đảng Cộng sản Việt Nam tiếp tục vận dụng trong công cuộc bảo vệ chủ quyền biên giới và hải đảo hiện nay là:',
    options: ['Nắm bắt thời cơ, kết hợp sức mạnh dân tộc với sức mạnh thời đại', 'Chỉ dựa vào sự viện trợ của các nước lớn bên ngoài', 'Tiến hành khởi nghĩa đồng loạt ở nông thôn trước thành thị', 'Xây dựng quân đội thường trực có quân số đông nhất khu vực'],
    correctIndex: 0,
    explanation: 'Nắm bắt chính xác thời cơ, phát huy tối đa khối đại đoàn kết toàn dân tộc (sức mạnh nội tại) kết hợp tranh thủ sự ủng hộ quốc tế, hòa bình và luật pháp quốc tế (sức mạnh thời đại) là bài học kim chỉ nam xuyên suốt.',
    sourceExam: 'Đề Đánh Giá Năng Lực & 9+ THPT'
  },

  // --- ĐỊA LÝ ---
  {
    id: 'geo-01',
    subject: 'dia_ly',
    subjectName: 'Địa lý',
    bloomLevel: 'Nhận biết',
    text: 'Gió mùa mùa hạ hoạt động ở nước ta đầu mùa hạ có hướng chủ yếu là hướng nào?',
    options: ['Tây Nam', 'Đông Bắc', 'Đông Nam', 'Tây Bắc'],
    correctIndex: 0,
    explanation: 'Vào đầu mùa hạ, khối khí nhiệt đới ẩm từ Bắc Ấn Độ Dương di chuyển vào nước ta theo hướng Tây Nam, gây mưa lớn cho Tây Nguyên và Nam Bộ.',
    sourceExam: 'Đề Thi Tốt Nghiệp THPT'
  },
  {
    id: 'geo-02',
    subject: 'dia_ly',
    subjectName: 'Địa lý',
    bloomLevel: 'Thông hiểu',
    text: 'Nguyên nhân chủ yếu làm cho cơ cấu ngành công nghiệp nước ta có sự chuyển dịch tích cực theo hướng công nghiệp hóa hiện đại hóa là:',
    options: ['Tác động của công cuộc Đổi mới và chính sách hội nhập kinh tế quốc tế', 'Tài nguyên khoáng sản được phát hiện thêm nhiều mỏ trữ lượng lớn', 'Dân số tăng nhanh tạo ra nguồn lao động giá rẻ', 'Sự phân bố đồng đều của các khu công nghiệp trên toàn quốc'],
    correctIndex: 0,
    explanation: 'Đường lối Đổi mới, mở cửa hội nhập kinh tế quốc tế và thu hút đầu tư trực tiếp nước ngoài (FDI) là động lực quyết định thúc đẩy chuyển dịch cơ cấu ngành kinh tế.',
    sourceExam: 'Đề Khảo Sát Tốt Nghiệp'
  },
  {
    id: 'geo-03',
    subject: 'dia_ly',
    subjectName: 'Địa lý',
    bloomLevel: 'Vận dụng',
    text: 'Ý nghĩa kinh tế to lớn nhất của việc phát triển các tuyến đường ngang kết nối Tây Nguyên với các cảng biển Duyên hải Nam Trung Bộ là:',
    options: ['Thúc đẩy lưu thông hàng hóa, hình thành các hành lang kinh tế Đông - Tây xuất khẩu', 'Giải quyết triệt để tình trạng hạn hán vào mùa khô ở Tây Nguyên', 'Làm giảm tỷ lệ gia tăng tự nhiên của dân số', 'Bảo tồn diện tích rừng khộp nguyên sinh'],
    correctIndex: 0,
    explanation: 'Các tuyến đường ngang kết nối vùng nguyên liệu trù phú Tây Nguyên với hệ thống cảng biển nước sâu Nam Trung Bộ giúp mở rộng cửa ngõ ra biển, hạ giá thành logistics và hội nhập.',
    sourceExam: 'Đề Thi Học Sinh Giỏi & THPT QG'
  },
  {
    id: 'geo-04',
    subject: 'dia_ly',
    subjectName: 'Địa lý',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Biện pháp có ý nghĩa chiến lược hàng đầu để thích ứng với biến đổi khí hậu và hiện tượng xâm nhập mặn sâu tại vùng Đồng bằng sông Cửu Long hiện nay là:',
    options: ['Chủ động "sống chung với mặn", chuyển đổi cơ cấu cây trồng mùa vụ và tích trữ nước ngọt hợp lý', 'Xây dựng đê bao ngăn mặn khép kín trên toàn bộ diện tích châu thổ', 'Di dời toàn bộ các đô thị ven biển vào sâu trong nội địa', 'Ngăn chặn hoàn toàn việc khai thác nguồn nước ngầm trong mùa mưa'],
    correctIndex: 0,
    explanation: 'Theo Nghị quyết 120/NQ-CP của Chính phủ, quan điểm phát triển bền vững ĐBSCL là "thuận thiên", tôn trọng quy luật tự nhiên, coi nước lợ, nước mặn cũng là tài nguyên để chuyển dịch kinh tế (nuôi tôm, thủy sản) kết hợp tích ngọt.',
    sourceExam: 'Đề Thi Thử THPT Quốc Gia'
  },

  // --- TIẾNG ANH ---
  {
    id: 'eng-01',
    subject: 'tieng_anh',
    subjectName: 'Tiếng Anh',
    bloomLevel: 'Nhận biết',
    text: 'Mark the letter A, B, C, or D to indicate the correct answer: "If I _______ you, I would study harder for the national examination."',
    options: ['were', 'am', 'was', 'have been'],
    correctIndex: 0,
    explanation: 'Câu điều kiện loại 2 (giả định không có thật ở hiện tại): If + S + were/V-ed, S + would/could + V-bare.',
    sourceExam: 'Đề Thi THPT Quốc Gia'
  },
  {
    id: 'eng-02',
    subject: 'tieng_anh',
    subjectName: 'Tiếng Anh',
    bloomLevel: 'Thông hiểu',
    text: 'Mark the letter A, B, C, or D to indicate the word OPPOSITE in meaning to the underlined word: "The teacher gave an EXPLICIT explanation so all students could grasp the formula."',
    options: ['ambiguous', 'obvious', 'straightforward', 'precise'],
    correctIndex: 0,
    explanation: 'Explicit có nghĩa là rõ ràng, rành mạch. Từ trái nghĩa là "ambiguous" (mơ hồ, nước đôi).',
    sourceExam: 'Đề Thi Thử Chuyên Ngoại Ngữ'
  },
  {
    id: 'eng-03',
    subject: 'tieng_anh',
    subjectName: 'Tiếng Anh',
    bloomLevel: 'Vận dụng',
    text: 'Choose the correct answer: "Hardly _______ down to dinner when the school fire alarm went off."',
    options: ['had we sat', 'we had sat', 'did we sit', 'we sat'],
    correctIndex: 0,
    explanation: 'Cấu trúc đảo ngữ thời gian: Hardly + had + S + V(p.p) + when + S + V(quá khứ đơn): Ngay khi... thì... Do đó "had we sat" là đáp án chính xác.',
    sourceExam: 'Đề Thi Tuyển Chọn Học Sinh Giỏi'
  },
  {
    id: 'eng-04',
    subject: 'tieng_anh',
    subjectName: 'Tiếng Anh',
    bloomLevel: 'Vận dụng cao',
    text: '⚡ [VƯỢT RÀO] Mark the correct idiom: "After months of rigorous preparation, Lan was _______ when she heard she won the National First Prize."',
    options: ['on cloud nine', 'down in the dumps', 'under the weather', 'out of the woods'],
    correctIndex: 0,
    explanation: 'Thành ngữ "on cloud nine" = extremely happy and exhilarated (vui sướng tột cùng, lâng lâng trên chín tầng mây). "Down in the dumps" = buồn chán; "under the weather" = mệt mỏi/ốm; "out of the woods" = thoát hiểm.',
    sourceExam: 'Đề Thi 9+ THPT Quốc Gia'
  }
];

export const DEFAULT_TEAMS_CONFIG = [
  { name: 'Bạch Mã', colorHex: '#3b82f6', clothColorHex: '#2563eb', jockeyColorHex: '#1d4ed8', horseColor: 'white' },
  { name: 'Xích Thố', colorHex: '#ef4444', clothColorHex: '#dc2626', jockeyColorHex: '#b91c1c', horseColor: 'red_chestnut' },
  { name: 'Kim Mã', colorHex: '#eab308', clothColorHex: '#ca8a04', jockeyColorHex: '#a16207', horseColor: 'gold' },
  { name: 'Lục Mã', colorHex: '#22c55e', clothColorHex: '#16a34a', jockeyColorHex: '#15803d', horseColor: 'palomino' },
  { name: 'Hắc Mã', colorHex: '#a855f7', clothColorHex: '#9333ea', jockeyColorHex: '#7e22ce', horseColor: 'black' },
  { name: 'Phi Long', colorHex: '#06b6d4', clothColorHex: '#0891b2', jockeyColorHex: '#0e7490', horseColor: 'brown' },
  { name: 'Phượng Hoàng', colorHex: '#f97316', clothColorHex: '#ea580c', jockeyColorHex: '#c2410c', horseColor: 'dappled' },
  { name: 'Hùng Kê', colorHex: '#ec4899', clothColorHex: '#db2777', jockeyColorHex: '#be185d', horseColor: 'grey' },
];
