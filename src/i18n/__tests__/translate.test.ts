import { setActiveLanguage, translate } from '..';

afterEach(() => setActiveLanguage('vi'));

describe('translate', () => {
  it('leaves Vietnamese untouched when Vietnamese is selected', () => {
    expect(translate('Đăng nhập')).toBe('Đăng nhập');
  });

  describe('in English', () => {
    beforeEach(() => setActiveLanguage('en'));

    it('looks whole strings up, keeping surrounding whitespace', () => {
      expect(translate('Đăng nhập')).toBe('Sign in');
      expect(translate(' Huỷ ')).toBe(' Cancel ');
    });

    it('reuses entries for headings that were upper-cased in code', () => {
      expect(translate('THÔNG TIN CÁ NHÂN')).toBe('PERSONAL DETAILS');
    });

    it('fills numbers, times and names into patterns', () => {
      expect(translate('19 trên 20 phòng đang trống lúc 01:44.')).toBe('19 of 20 rooms are free at 01:44.');
      expect(translate('Trống đến 21:00')).toBe('Free until 21:00');
      expect(translate('Còn 1 khung giờ trống')).toBe('1 slot free');
      expect(translate('Đã đặt, Bình')).toBe('Booked, Bình');
      expect(translate('Tháng 10')).toBe('October');
      expect(translate('T3, 20/10')).toBe('Tue, 20/10');
    });

    it('translates durations nested inside a sentence', () => {
      expect(translate('Mỗi ngày bạn được đặt tối đa 4 ca, mỗi ca không quá 2 giờ.')).toBe('You can book at most 4 slots a day, each up to 2 h.');
      expect(translate('2 ca · 1 giờ 34 phút')).toBe('2 slots · 1 h 34 min');
    });

    it('translates compound labels part by part and leaves data alone', () => {
      expect(translate('Toà A · Tầng 2 · 6 chỗ')).toBe('Building A · Floor 2 · 6 seats');
      expect(translate('Toà A, Toà B')).toBe('Building A, Building B');
      expect(translate('A-102 · Phòng học nhóm 2')).toBe('A-102 · Phòng học nhóm 2');
      expect(translate('Nguyễn Văn An')).toBe('Nguyễn Văn An');
    });
  });
});
