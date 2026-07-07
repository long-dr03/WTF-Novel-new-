import type { Request, Response } from '../types';
import User from '../models/User';
import Novel from '../models/Novel';
import Genre from '../models/Genre';
import Setting from '../models/Setting';
import Chapter from '../models/Chapter';
import Library from '../models/Library';
import Music from '../models/Music';
import Report from '../models/Report';
import Comment from '../models/Comment';

// --- Dashboard Stats ---
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalNovels = await Novel.countDocuments();
        const totalGenres = await Genre.countDocuments();

        const viewsResult = await Novel.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        const chapterViewsResult = await Chapter.aggregate([
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const realViews = chapterViewsResult.length > 0 ? chapterViewsResult[0].totalViews : 0;

        res.status(200).json({
            totalUsers,
            totalNovels,
            totalGenres,
            totalViews,
            realViews
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thống kê dashboard', error });
    }
};

// --- User Management ---
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const query: any = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .select('-password');

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng', error });
    }
};

export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isBanned, role } = req.body;

        const updateData: any = {};
        if (isBanned !== undefined) updateData.isBanned = isBanned;
        if (role) updateData.role = role;

        const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        res.status(200).json({ message: 'Cập nhật trạng thái người dùng thành công', user });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật người dùng', error });
    }
};

// --- Novel Management ---
export const getNovels = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const query: any = {};

        if (status) query.publishStatus = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const novels = await Novel.find(query)
            .populate('author', 'username email')
            .populate('genres', 'name')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const total = await Novel.countDocuments(query);

        res.status(200).json({
            novels,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách truyện', error });
    }
};

export const approveNovel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const novel = await Novel.findByIdAndUpdate(
            id,
            { publishStatus: 'published' },
            { new: true }
        );

        if (!novel) return res.status(404).json({ message: 'Không tìm thấy truyện' });

        res.status(200).json({ message: 'Đã duyệt truyện thành công', novel });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi duyệt truyện', error });
    }
};

export const rejectNovel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const novel = await Novel.findByIdAndUpdate(
            id,
            {
                publishStatus: 'rejected',
                adminComment: reason || ''
            },
            { new: true }
        );

        if (!novel) return res.status(404).json({ message: 'Không tìm thấy truyện' });

        res.status(200).json({ message: 'Đã từ chối truyện', novel });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi từ chối truyện', error });
    }
};

export const toggleFeatured = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const novel = await Novel.findById(id);

        if (!novel) return res.status(404).json({ message: 'Không tìm thấy truyện' });

        novel.isFeatured = !novel.isFeatured;
        await novel.save();

        res.status(200).json({
            message: `Đã ${novel.isFeatured ? 'thêm vào' : 'xóa khỏi'} danh sách nổi bật`,
            novel
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái nổi bật', error });
    }
};

export const deleteNovel = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const novel = await Novel.findByIdAndDelete(id);

        if (!novel) return res.status(404).json({ message: 'Không tìm thấy truyện' });

        res.status(200).json({ message: 'Đã xóa truyện thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa truyện', error });
    }
};

// --- Genre Management ---
export const getGenres = async (req: Request, res: Response) => {
    try {
        const genres = await Genre.find().sort({ name: 1 });
        res.status(200).json(genres);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách thể loại', error });
    }
};

export const createGenre = async (req: Request, res: Response) => {
    try {
        const { name, description, slug, image } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ message: 'Tên và Slug là bắt buộc' });
        }

        const existingGenre = await Genre.findOne({ slug });
        if (existingGenre) {
            return res.status(400).json({ message: 'Slug thể loại đã tồn tại' });
        }

        const newGenre = new Genre({ name, description, slug, image });
        await newGenre.save();

        res.status(201).json(newGenre);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên thể loại hoặc slug đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi khi tạo thể loại mới', error });
    }
};

export const updateGenre = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, slug, image } = req.body;

        const genre = await Genre.findByIdAndUpdate(
            id,
            { name, description, slug, image },
            { new: true }
        );

        if (!genre) return res.status(404).json({ message: 'Không tìm thấy thể loại' });

        res.status(200).json(genre);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên thể loại hoặc slug đã tồn tại' });
        }
        res.status(500).json({ message: 'Lỗi khi cập nhật thể loại', error });
    }
};

export const deleteGenre = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const genre = await Genre.findByIdAndDelete(id);
        if (!genre) return res.status(404).json({ message: 'Không tìm thấy thể loại' });

        res.status(200).json({ message: 'Đã xóa thể loại' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa thể loại', error });
    }
};

export const seedGenres = async (req: Request, res: Response) => {
    try {
        const seedGenresData = [
            { name: 'Tiên Hiệp', slug: 'tien-hiep', description: 'Thể loại tu tiên, tu luyện, với những câu chuyện về việc tìm kiếm đạo và trường sinh' },
            { name: 'Huyền Huyễn', slug: 'huyen-huyen', description: 'Thể loại giả tưởng phương Đông với ma pháp, võ công và những yếu tố huyền bí' },
            { name: 'Đô Thị', slug: 'do-thi', description: 'Thể loại đời thường trong bối cảnh đô thị hiện đại' },
            { name: 'Hệ Thống', slug: 'he-thong', description: 'Nhân vật chính nhận được hệ thống hỗ trợ với nhiệm vụ và phần thưởng' },
            { name: 'Trọng Sinh', slug: 'trong-sinh', description: 'Nhân vật chính được trở về quá khứ để sống lại cuộc đời' },
            { name: 'Xuyên Không', slug: 'xuyen-khong', description: 'Nhân vật di chuyển qua không gian hoặc thời gian sang thế giới khác' },
            { name: 'Ngôn Tình', slug: 'ngon-tinh', description: 'Thể loại tình cảm, lãng mạn' },
            { name: 'Kiếm Hiệp', slug: 'kiem-hiep', description: 'Thể loại võ hiệp cổ điển với giang hồ, kiếm pháp' },
            { name: 'Khoa Huyễn', slug: 'khoa-huyen', description: 'Thể loại khoa học viễn tưởng' },
            { name: 'Đồng Nhân', slug: 'dong-nhan', description: 'Truyện dựa trên các tác phẩm gốc đã có' }
        ];

        await Genre.deleteMany({});

        const inserted = await Genre.insertMany(seedGenresData);

        res.status(200).json({
            message: `Đã thêm ${inserted.length} thể loại mẫu`,
            genres: inserted
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi seed thể loại', error });
    }
};

// --- Settings Management ---
export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = await Setting.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy cài đặt', error });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting(req.body);
        } else {
            // .set() là deep-setter của Mongoose, theo dõi đúng các path lồng nhau
            settings.set(req.body);
        }
        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật cài đặt', error });
    }
};

// --- Backup Management ---
export const backupData = async (req: Request, res: Response) => {
    try {
        const { collections, fromDate, toDate } = req.body;
        
        if (!collections || !Array.isArray(collections) || collections.length === 0) {
            return res.status(400).json({ message: 'Danh sách collection cần backup không hợp lệ' });
        }

        const dateQuery: any = {};
        if (fromDate || toDate) {
            dateQuery.createdAt = {};
            if (fromDate) dateQuery.createdAt.$gte = new Date(fromDate);
            if (toDate) dateQuery.createdAt.$lte = new Date(toDate);
        }

        const backupResult: any = {};

        const modelsMap: { [key: string]: any } = {
            users: User,
            novels: Novel,
            genres: Genre,
            chapters: Chapter,
            libraries: Library,
            musics: Music,
            reports: Report,
            settings: Setting,
            comments: Comment
        };

        for (const colName of collections) {
            const Model = modelsMap[colName];
            if (Model) {
                const supportsTimestamps = ['users', 'novels', 'chapters', 'reports', 'libraries', 'musics', 'comments'].includes(colName);
                const query = (supportsTimestamps && (fromDate || toDate)) ? dateQuery : {};
                
                const docs = await Model.find(query);
                backupResult[colName] = docs;
            }
        }

        res.status(200).json({
            message: 'Backup dữ liệu thành công',
            timestamp: new Date().toISOString(),
            data: backupResult
        });
    } catch (error) {
        console.error("Backup error in NextJS server:", error);
        res.status(500).json({ message: 'Lỗi khi thực hiện backup dữ liệu', error });
    }
};

// --- Restore Management ---
export const restoreData = async (req: Request, res: Response) => {
    try {
        const { backupData } = req.body;
        if (!backupData || typeof backupData !== 'object') {
            return res.status(400).json({ message: 'Dữ liệu sao lưu không hợp lệ' });
        }

        const modelsMap: { [key: string]: any } = {
            users: User,
            novels: Novel,
            genres: Genre,
            chapters: Chapter,
            libraries: Library,
            musics: Music,
            reports: Report,
            settings: Setting,
            comments: Comment
        };

        const restoredCollections: string[] = [];

        for (const colName of Object.keys(backupData)) {
            const Model = modelsMap[colName];
            const docs = backupData[colName];
            if (Model && Array.isArray(docs)) {
                // Xóa toàn bộ dữ liệu hiện tại
                await Model.deleteMany({});
                // Nạp dữ liệu sao lưu cũ vào
                if (docs.length > 0) {
                    await Model.insertMany(docs);
                }
                restoredCollections.push(colName);
            }
        }

        res.status(200).json({
            message: 'Khôi phục dữ liệu thành công',
            restoredCollections
        });
    } catch (error) {
        console.error("Restore error in NextJS server:", error);
        res.status(500).json({ message: 'Lỗi khi khôi phục dữ liệu', error });
    }
};
