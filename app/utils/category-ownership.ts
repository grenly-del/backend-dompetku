import { TransactionType } from '@prisma/client'
import { prisma } from '../config/adapterDB'

type FindOwnedCategoryParams = {
    userId: string
    categoryId: string
    type?: TransactionType
    requireActive?: boolean
}

type FindOwnedCategoriesParams = {
    userId: string
    categoryIds: string[]
    type?: TransactionType
    requireActive?: boolean
}

export const findOwnedCategory = async ({
    userId,
    categoryId,
    requireActive = true,
}: FindOwnedCategoryParams) => {
    console.log(userId, categoryId, requireActive)
    return prisma.category.findFirst({
        where: {
            id: categoryId.trim(),
            userId: userId.trim(),
        },
        select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
        },
    })
}

export const findOwnedCategories = async ({
    userId,
    categoryIds,
    type,
    requireActive = true,
}: FindOwnedCategoriesParams) => {
    const uniqueCategoryIds = [...new Set(categoryIds)]

    if (uniqueCategoryIds.length === 0) {
        return []
    }

    return prisma.category.findMany({
        where: {
            id: { in: uniqueCategoryIds },
            userId,
            ...(type && { type }),
            ...(requireActive && { isActive: true }),
        },
        select: {
            id: true,
            name: true,
            type: true,
        },
    })
}
