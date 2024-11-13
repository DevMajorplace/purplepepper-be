import { Model } from 'mongoose';

export interface PaginationResult<T> {
	data: T[];
	totalItems: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
}

export async function paginate<T>(
	model: Model<T>,
	page: number = 1,
	pageSize: number = 15,
	query: any = {},
	sort: any = {},
): Promise<PaginationResult<T>> {
	// 페이지네이션 계산
	const skip = (page - 1) * pageSize;

	// 전체 항목 수와 지정된 페이지의 데이터 가져오기
	const [data, totalItems] = await Promise.all([
		model.find(query).sort(sort).skip(skip).limit(pageSize).exec(),
		model.countDocuments(query),
	]);

	// 전체 페이지 수 계산
	const totalPages = Math.ceil(totalItems / pageSize);

	return {
		data,
		totalItems,
		totalPages,
		currentPage: page,
		pageSize,
	};
}
