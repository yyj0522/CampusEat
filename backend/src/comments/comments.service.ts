import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { User } from '../users/user.entity';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class CommentsService {
  async create(createCommentDto: CreateCommentDto, postId: number, user: User): Promise<Comment> {
    const { content, parentId, isAnonymous } = createCommentDto;
    const post = await Post.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException(`Post with ID "${postId}" not found`);
    }

    const comment = new Comment();
    comment.content = content;
    comment.post = post;
    comment.user = user;
    comment.isAnonymous = isAnonymous || false;

    if (parentId) {
      const parentComment = await Comment.findOne({ where: { id: parentId } });
      if (!parentComment) {
        throw new NotFoundException(`Parent comment with ID "${parentId}" not found`);
      }
      comment.parent = parentComment;
    }

    await comment.save();
    return comment;
  }

  async findAll(postId: number): Promise<Comment[]> {
    return Comment.find({
      where: {
        post: { id: postId },
      },
      relations: ['user', 'parent', 'children', 'children.user'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOne(id: number, relations: string[] = ['user']): Promise<Comment> {
    const comment = await Comment.findOne({ where: { id }, relations });
    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }
    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, user: User): Promise<Comment> {
    const comment = await this.findOne(id);
    if (comment.user.id !== user.id) {
      throw new UnauthorizedException('You can only update your own comments');
    }
    comment.content = updateCommentDto.content;
    await comment.save();
    return comment;
  }

  async remove(id: number, user: User): Promise<void> {
    const comment = await this.findOne(id, ['user', 'children', 'parent']);

    const isAuthor = comment.user?.id === user.id;
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    if (!isAuthor && !isAdmin) {
      throw new UnauthorizedException('댓글을 삭제할 권한이 없습니다.');
    }

    const hasReplies = comment.children && comment.children.length > 0;

    if (hasReplies) {
      if (isAdmin && !isAuthor) {
        comment.content = '관리자에 의해 삭제된 댓글입니다.';
      } else {
        comment.content = '작성자에 의해 삭제된 댓글입니다.';
      }
      // --- ---
      comment.isDeleted = true;
      comment.user = null; 
      await comment.save();
    } else {
      const parent = comment.parent;
      await comment.remove();

      if (parent) {
        await this.cleanupParentIfNeeded(parent.id);
      }
    }
  }

  private async cleanupParentIfNeeded(parentId: number): Promise<void> {
    const parent = await this.findOne(parentId, ['children', 'parent']);

    if (parent.isDeleted && parent.children.length === 0) {
      const grandParent = parent.parent;
      await parent.remove();

      if (grandParent) {
        await this.cleanupParentIfNeeded(grandParent.id);
      }
    }
  }

  async likeComment(commentId: number, user: User): Promise<Comment> {
    const comment = await this.findOne(commentId);
    let likedByArray = comment.likedBy ? comment.likedBy.split(',').filter(id => id !== '') : [];

    const userIdString = user.id.toString();

    if (likedByArray.includes(userIdString)) {
      comment.likeCount = Math.max((comment.likeCount || 1) - 1, 0);
      likedByArray = likedByArray.filter(id => id !== userIdString);
    } else {
      comment.likeCount = (comment.likeCount || 0) + 1;
      likedByArray.push(userIdString);
    }

    comment.likedBy = likedByArray.join(',');
    await comment.save();

    return comment;
  }
}