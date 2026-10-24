import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { RaceReportData } from '../types';

export class ExportService {
  /**
   * Export comprehensive multi-sheet Excel workbook (.xlsx)
   */
  public static exportToExcel(report: RaceReportData) {
    const wb = XLSX.utils.book_new();

    // 1. Sheet 1: Bảng Xếp Hạng Đội Đua
    const teamsData = report.teams
      .sort((a, b) => b.score - a.score || b.progress - a.progress)
      .map((t, idx) => ({
        'Hạng': idx + 1,
        'Tên Đội': t.name,
        'Màu Sắc': t.horseColor,
        'Điểm Số': t.score,
        'Tiến Độ Về Đích (%)': `${Math.round(t.progress)}%`,
        'Số Lần Vượt Rào': t.hurdlesCleared,
        'Số Thành Viên': t.members.length,
      }));

    const wsTeams = XLSX.utils.json_to_sheet(teamsData);
    XLSX.utils.book_append_sheet(wb, wsTeams, 'Bảng Xếp Hạng Đội');

    // 2. Sheet 2: Chi Tiết Học Sinh
    const studentsData = report.students.map((s, idx) => {
      const answersList = Object.values(s.answers);
      const totalAnswers = answersList.length;
      const correctAnswers = answersList.filter((a) => a.isCorrect).length;
      const accuracy = totalAnswers > 0 ? `${Math.round((correctAnswers / totalAnswers) * 100)}%` : '0%';
      const avgTime = totalAnswers > 0
        ? (answersList.reduce((acc, a) => acc + a.responseTimeSec, 0) / totalAnswers).toFixed(1) + 's'
        : '0s';

      const team = report.teams.find((t) => t.id === s.teamId);

      return {
        'STT': idx + 1,
        'Họ và Tên': s.name,
        'Lớp': s.className,
        'Đội Đua': team ? team.name : 'Chưa phân đội',
        'Số Câu Trả Lời Đúng': `${correctAnswers}/${totalAnswers}`,
        'Độ Chính Xác': accuracy,
        'Thời Gian TB (giây)': avgTime,
      };
    });

    const wsStudents = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Danh Sách Học Sinh');

    // 3. Sheet 3: Ma Trận Phân Tích Câu Hỏi
    const questionsData = report.questions.map((q, idx) => {
      let correct = 0;
      let total = 0;
      report.students.forEach((s) => {
        const a = s.answers[q.id];
        if (a) {
          total++;
          if (a.isCorrect) correct++;
        }
      });

      const accuracy = total > 0 ? `${Math.round((correct / total) * 100)}%` : '0%';
      const wrong = total - correct;
      const wrongPercent = total > 0 ? `${Math.round((wrong / total) * 100)}%` : '0%';

      return {
        'Câu Số': idx + 1,
        'Nội Dung Câu Hỏi': q.text,
        'Môn Học': q.subjectName,
        'Cấp Độ Tư Duy (Bloom)': q.bloomLevel,
        'Đáp Án Đúng': ['A', 'B', 'C', 'D'][q.correctIndex],
        'Số Lượt Trả Lời': total,
        'Tỷ Lệ Đúng (%)': accuracy,
        'Tỷ Lệ Sai (%)': wrongPercent,
        'Đánh Giá Sư Phạm': wrongPercent > '50%' ? 'Cần củng cố gấp' : 'Đạt yêu cầu',
      };
    });

    const wsQuestions = XLSX.utils.json_to_sheet(questionsData);
    XLSX.utils.book_append_sheet(wb, wsQuestions, 'Ma Trận Câu Hỏi');

    // Export file
    const fileName = `Bao_Cao_Dua_Ngua_THPT_${report.roomPin}_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Export professional printable PDF (.pdf) with Vietnamese pedagogical report
   */
  public static exportToPDF(report: RaceReportData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header standard Vietnamese pedagogical style
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BO GIAO DUC VA DAO TAO - ON THI TOT NGHIEP THPT', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('HE THONG GAME 3D DUA NGUA TRI THUC - REPORT PEDAGOGIQUE', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.setLineWidth(0.3);
    doc.line(30, y, pageWidth - 30, y);
    y += 8;

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('BAO CAO PHAN TICH KET QUA ON LUYEN THPT', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Mon thi: ${report.subjectName.toUpperCase()} | Ma phong (PIN): ${report.roomPin} | Ngay thi: ${report.dateStr}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Summary Box
    doc.setDrawColor(50, 100, 200);
    doc.setFillColor(245, 248, 255);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 60, 150);
    doc.text(`DOI VO DICH: ${report.winningTeam.name.toUpperCase()} (Diem: ${report.winningTeam.score} | Vuot rao: ${report.winningTeam.hurdlesCleared} lan)`, 20, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(`Tong so cau hoi: ${report.totalQuestions} cau  |  Tong so hoc sinh tham gia: ${report.totalStudents} em  |  So doi dua: ${report.teams.length} doi`, 20, y + 16);
    y += 28;

    // Section 1: Team rankings
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('1. BANG XEP HANG CAC DOI DUA CHIEN MA:', 14, y);
    y += 6;

    // Table Header
    doc.setFillColor(230, 235, 245);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(9);
    doc.text('Hang', 18, y + 5);
    doc.text('Ten Doi Chien Ma', 35, y + 5);
    doc.text('Diem So', 85, y + 5);
    doc.text('Tien Do (%)', 115, y + 5);
    doc.text('Vuot Rao Cao', 145, y + 5);
    doc.text('Thanh Vien', 175, y + 5);
    y += 7;

    // Table Rows
    const sortedTeams = [...report.teams].sort((a, b) => b.score - a.score || b.progress - a.progress);
    sortedTeams.forEach((t, i) => {
      doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
      doc.text(`${i + 1}`, 18, y + 5);
      doc.text(t.name, 35, y + 5);
      doc.text(`${t.score}`, 85, y + 5);
      doc.text(`${Math.round(t.progress)}%`, 115, y + 5);
      doc.text(`${t.hurdlesCleared}`, 145, y + 5);
      doc.text(`${t.members.length} hs`, 175, y + 5);
      y += 6;
      doc.setDrawColor(220, 220, 220);
      doc.line(14, y, pageWidth - 14, y);
    });
    y += 8;

    // Section 2: Bloom Taxonomy Analysis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. PHAN TICH NANG LUC THEO 4 CAP DO TU DUY (BLOOM):', 14, y);
    y += 6;

    report.bloomStats.forEach((b) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`- Cap do [${b.level}]: Tong so ${b.total} cau | Tra loi dung: ${b.correct} | Ty le chinh xac: ${b.accuracyPercent}%`, 20, y + 4);
      y += 6;
    });
    y += 6;

    // Section 3: Difficult questions matrix
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. MA TRAN CAC CAU HOI CO TY LE SAI CAO (CAN CUNG CO GIAO VIEN):', 14, y);
    y += 6;

    if (report.difficultQuestions.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Cac em hoc sinh hoan thanh xuat sac tat ca cac cau hoi trong phong thi!', 20, y + 4);
      y += 8;
    } else {
      report.difficultQuestions.slice(0, 3).forEach((item, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Cau ${idx + 1} (${item.question.bloomLevel}): Ty le sai: ${item.wrongPercent}%`, 20, y + 4);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(item.question.text, pageWidth - 45);
        doc.text(splitText, 25, y + 4);
        y += splitText.length * 4 + 4;
      });
    }

    // Teacher Pedagogical Signature Footer
    y = Math.min(y + 8, 260);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Giao vien bo mon da ky va xac nhan ket qua.', pageWidth - 80, y);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('(Ky va ghi ro ho ten)', pageWidth - 70, y);

    // Save PDF
    const fileName = `Bao_Cao_Su_Pham_THPT_${report.roomPin}_${Date.now()}.pdf`;
    doc.save(fileName);
  }
}
