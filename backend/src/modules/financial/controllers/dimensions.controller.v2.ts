/**
 * Dimensions Controller V2
 * Tenant-aware REST API endpoints for financial dimensions management
 * 
 * NOTE: This v2 controller enforces tenant context at the controller level.
 * The underlying DimensionsService will need to be updated to accept tenantId
 * for full multi-tenant isolation.
 * 
 * Manages: Cost Centers, Departments, Projects, Products, Locations
 */

import { Request, Response } from 'express';
import { DimensionsService } from '../services/dimensions.service';

// Tenant-aware request type
interface TenantRequest extends Request {
  tenant?: { id: string };
  user?: { id: string; email: string; role: string; permissions: string[]; first_name?: string; last_name?: string };
}

// Extract tenant context with validation
function getTenantContext(req: TenantRequest): { tenantId: string; userId: string } {
  const tenantId = req.tenant?.id;
  const userId = req.user?.id;
  if (!tenantId) throw new Error('Tenant context required');
  if (!userId) throw new Error('User context required');
  return { tenantId, userId };
}

const dimensionsService = new DimensionsService();

// ============================================================================
// COST CENTERS
// ============================================================================

export const getAllCostCenters = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req); // Validate tenant exists
    const { include_inactive = 'false' } = req.query;
    
    const costCenters = await dimensionsService.getAllCostCenters(include_inactive === 'true');
    
    res.json({ success: true, data: costCenters });
  } catch (error) {
    console.error('[DimensionsV2] Get cost centers error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getCostCenter = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req); // Validate tenant exists
    const { code } = req.params;
    
    const costCenter = await dimensionsService.getCostCenterByCode(code);
    
    if (!costCenter) {
      res.status(404).json({ success: false, error: 'Cost center not found' });
      return;
    }
    
    res.json({ success: true, data: costCenter });
  } catch (error) {
    console.error('[DimensionsV2] Get cost center error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createCostCenter = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const id = await dimensionsService.createCostCenter(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Cost center created successfully',
    });
  } catch (error) {
    console.error('[DimensionsV2] Create cost center error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const updateCostCenter = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.updateCostCenter(code, req.body, userId);
    
    res.json({ success: true, message: 'Cost center updated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Update cost center error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const deleteCostCenter = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req); // Validate tenant exists
    const { code } = req.params;
    
    await dimensionsService.deleteCostCenter(code);
    
    res.json({ success: true, message: 'Cost center deactivated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Delete cost center error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// DEPARTMENTS
// ============================================================================

export const getAllDepartments = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { include_inactive = 'false' } = req.query;
    
    const departments = await dimensionsService.getAllDepartments(include_inactive === 'true');
    
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('[DimensionsV2] Get departments error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getDepartment = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    const department = await dimensionsService.getDepartmentByCode(code);
    
    if (!department) {
      res.status(404).json({ success: false, error: 'Department not found' });
      return;
    }
    
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('[DimensionsV2] Get department error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createDepartment = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const id = await dimensionsService.createDepartment(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Department created successfully',
    });
  } catch (error) {
    console.error('[DimensionsV2] Create department error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const updateDepartment = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.updateDepartment(code, req.body, userId);
    
    res.json({ success: true, message: 'Department updated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Update department error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const deleteDepartment = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.deleteDepartment(code);
    
    res.json({ success: true, message: 'Department deactivated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Delete department error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// PROJECTS
// ============================================================================

export const getAllProjects = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { include_inactive = 'false' } = req.query;
    
    const projects = await dimensionsService.getAllProjects(include_inactive === 'true');
    
    res.json({ success: true, data: projects });
  } catch (error) {
    console.error('[DimensionsV2] Get projects error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getProject = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    const project = await dimensionsService.getProjectByCode(code);
    
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }
    
    res.json({ success: true, data: project });
  } catch (error) {
    console.error('[DimensionsV2] Get project error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createProject = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const id = await dimensionsService.createProject(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Project created successfully',
    });
  } catch (error) {
    console.error('[DimensionsV2] Create project error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const updateProject = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.updateProject(code, req.body, userId);
    
    res.json({ success: true, message: 'Project updated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Update project error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const deleteProject = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.deleteProject(code);
    
    res.json({ success: true, message: 'Project deactivated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Delete project error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// PRODUCTS
// ============================================================================

export const getAllProducts = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { include_inactive = 'false' } = req.query;
    
    const products = await dimensionsService.getAllProducts(include_inactive === 'true');
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('[DimensionsV2] Get products error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getProduct = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    const product = await dimensionsService.getProductByCode(code);
    
    if (!product) {
      res.status(404).json({ success: false, error: 'Product not found' });
      return;
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[DimensionsV2] Get product error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createProduct = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const id = await dimensionsService.createProduct(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('[DimensionsV2] Create product error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const updateProduct = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.updateProduct(code, req.body, userId);
    
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Update product error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const deleteProduct = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.deleteProduct(code);
    
    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Delete product error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// LOCATIONS
// ============================================================================

export const getAllLocations = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { include_inactive = 'false' } = req.query;
    
    const locations = await dimensionsService.getAllLocations(include_inactive === 'true');
    
    res.json({ success: true, data: locations });
  } catch (error) {
    console.error('[DimensionsV2] Get locations error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const getLocation = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    const location = await dimensionsService.getLocationByCode(code);
    
    if (!location) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('[DimensionsV2] Get location error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const createLocation = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    
    const id = await dimensionsService.createLocation(req.body, userId);
    
    res.status(201).json({
      success: true,
      data: { id },
      message: 'Location created successfully',
    });
  } catch (error) {
    console.error('[DimensionsV2] Create location error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const updateLocation = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { userId } = getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.updateLocation(code, req.body, userId);
    
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Update location error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

export const deleteLocation = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    const { code } = req.params;
    
    await dimensionsService.deleteLocation(code);
    
    res.json({ success: true, message: 'Location deactivated successfully' });
  } catch (error) {
    console.error('[DimensionsV2] Delete location error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 400).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};

// ============================================================================
// SUMMARY
// ============================================================================

export const getDimensionSummary = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    getTenantContext(req);
    
    const summary = await dimensionsService.getDimensionSummary();
    
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('[DimensionsV2] Get dimension summary error:', error);
    res.status(error instanceof Error && error.message.includes('context') ? 401 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
};
