import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as assetService from '../services/asset.service';

export const getAllAssets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await assetService.getAllAssets(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.createAsset(req.body);
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body);
    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const assignAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.assignAsset(req.params.id, req.body.userId);
    res.json(asset);
  } catch (error) {
    next(error);
  }
};

export const returnAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.returnAsset(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
};
