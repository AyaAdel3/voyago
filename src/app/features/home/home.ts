import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  offers = [
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/400/300?random=1' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/400/300?random=2' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/400/300?random=15' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/400/300?random=16' },
    { title: 'Luxury Redefined, Now With Exclusive Discounts!', image: 'https://picsum.photos/400/300?random=17' },
  ];

  recommended = [
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=3', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=4', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=5', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=6', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=11', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=12', liked: false },
  ];

  availableThisWeek = [
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=7', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=8', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=9', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=10', liked: false },
    { name: 'House in tunis village', price: '1425le for 1 night', rating: 4.8, image: 'https://picsum.photos/300/200?random=13', liked: false },
    { name: 'Qaroun lake hotel', price: '182le for 3 nights', rating: 4.8, image: 'https://picsum.photos/300/200?random=14', liked: false },
  ];

  toggleLike(item: any) {
    item.liked = !item.liked;
  }
}
