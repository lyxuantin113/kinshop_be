// Repositories
import { UserRepository } from '../modules/user/user.repository';
import { ProductRepository } from '../modules/product/product.repository';
import { CategoryRepository } from '../modules/category/category.repository';
import { CartRepository } from '../modules/cart/cart.repository';
import { DiscountRepository } from '../modules/discount/discount.repository';
import { OrderRepository } from '../modules/order/order.repository';
import { SystemConfigRepository } from '../modules/system-config/system-config.repository';

// Services
import { UserService } from '../modules/user/user.service';
import { ProductService } from '../modules/product/product.service';
import { CategoryService } from '../modules/category/category.service';
import { CartService } from '../modules/cart/cart.service';
import { DiscountService } from '../modules/discount/discount.service';
import { OrderService } from '../modules/order/order.service';
import { ShippingService } from '../modules/order/shipping.service';
import { SystemConfigService } from '../modules/system-config/system-config.service';

// Controllers
import { UserController } from '../modules/user/user.controller';
import { ProductController } from '../modules/product/product.controller';
import { CategoryController } from '../modules/category/category.controller';
import { CartController } from '../modules/cart/cart.controller';
import { DiscountController } from '../modules/discount/discount.controller';
import { OrderController } from '../modules/order/order.controller';
import { SystemConfigController } from '../modules/system-config/system-config.controller';
import { StorageService } from './services/storage.service';

class Container {
    // Repositories
    public readonly userRepository = new UserRepository();
    public readonly productRepository = new ProductRepository();
    public readonly categoryRepository = new CategoryRepository();
    public readonly cartRepository = new CartRepository();
    public readonly discountRepository = new DiscountRepository();
    public readonly orderRepository = new OrderRepository();
    public readonly systemConfigRepository = new SystemConfigRepository();

    // Services
    public readonly storageService = new StorageService();
    public readonly userService = new UserService(this.userRepository);
    public readonly productService = new ProductService(this.productRepository, this.storageService);
    public readonly categoryService = new CategoryService(this.categoryRepository);
    public readonly cartService = new CartService(this.cartRepository);
    public readonly discountService = new DiscountService(this.discountRepository);
    public readonly systemConfigService = new SystemConfigService(this.systemConfigRepository);
    public readonly shippingService = new ShippingService(this.systemConfigService);
    public readonly orderService = new OrderService(
        this.orderRepository,
        this.cartRepository,
        this.productRepository,
        this.shippingService,
        this.discountService
    );

    // Controllers
    public readonly userController = new UserController(this.userService);
    public readonly productController = new ProductController(this.productService, this.storageService);
    public readonly categoryController = new CategoryController(this.categoryService);
    public readonly cartController = new CartController(this.cartService);
    public readonly discountController = new DiscountController(this.discountService);
    public readonly orderController = new OrderController(this.orderService);
    public readonly systemConfigController = new SystemConfigController(this.systemConfigService);
}

export const container = new Container();
